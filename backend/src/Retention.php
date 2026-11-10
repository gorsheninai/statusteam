<?php
declare(strict_types=1);
namespace StatusTeam;
final class Retention {
    public function __construct(private App $app) {}
    private function date(string $key): string {
        $v=$this->app->c['retention'][$key]??null;
        if(!is_string($v) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D',$v) || $v>=gmdate('Y-m-d')) throw new Problem(422,'approved_retention_date_required');return $v;
    }
    public function purge(bool $apply=false): array {
        $applications=$this->date('applications_before');$orders=$this->date('orders_before');$consents=$this->date('consents_before');
        $db=$this->app->db;
        if(time()<strtotime('2026-12-01T00:00:00+03:00')) throw new Problem(409,'event_not_finished');
        return $db->tx(function() use($db,$applications,$orders,$consents,$apply) {
            $db->one('SELECT id FROM inventory WHERE id=1 FOR UPDATE');
            $a=$db->run("SELECT id FROM applications a WHERE created_at<? AND NOT EXISTS(SELECT 1 FROM retention_holds h WHERE h.kind='application' AND h.reference_id=a.id) AND NOT EXISTS(SELECT 1 FROM consents c WHERE c.application_id=a.id AND c.created_at>=?) FOR UPDATE",[$applications,$consents])->fetchAll();
            $o=$db->run("SELECT id FROM orders o WHERE created_at<? AND status IN ('paid','refunded','canceled') AND NOT EXISTS(SELECT 1 FROM retention_holds h WHERE h.kind='order' AND h.reference_id=o.id) AND NOT EXISTS(SELECT 1 FROM consents c WHERE c.order_id=o.id AND c.created_at>=?) AND NOT EXISTS(SELECT 1 FROM refunds r WHERE r.order_id=o.id AND r.status NOT IN ('succeeded','canceled')) FOR UPDATE",[$orders,$consents])->fetchAll();
            if($apply) {
                foreach($a as $row) {
                    $db->run("DELETE FROM mail_queue WHERE reference_id=? AND kind='application'",[$row['id']]);
                    $db->run('DELETE FROM consents WHERE application_id=?',[$row['id']]);$db->run('DELETE FROM applications WHERE id=?',[$row['id']]);
                }
                foreach($o as $row) {
                    $id=$row['id'];$db->one('SELECT id FROM orders WHERE id=? FOR UPDATE',[$id]);
                    $db->run("DELETE FROM mail_queue WHERE reference_id=? AND kind='ticket'",[$id]);
                    $db->run('DELETE FROM admissions WHERE ticket_id IN (SELECT id FROM tickets WHERE order_id=?)',[$id]);
                    foreach(['tickets','refunds','consents','payments'] as $table) $db->run('DELETE FROM '.$table.' WHERE order_id=?',[$id]);
                    $db->run('DELETE FROM orders WHERE id=?',[$id]);
                }
            }
            return ['applications'=>count($a),'orders'=>count($o),'applied'=>$apply];
        });
    }
}
