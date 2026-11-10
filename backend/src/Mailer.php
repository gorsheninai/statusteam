<?php
declare(strict_types=1);
namespace StatusTeam;
use PHPMailer\PHPMailer\PHPMailer;
final class Mailer {
    public function __construct(private App $app) {}
    public function send(string $to,string $subject,string $body,string $messageId): void {
        $c=$this->app->c['smtp'];
        if(!$c['host'] || !in_array($c['encryption'],['tls','ssl'],true) || !$c['port'] || !$c['password']) throw new Problem(503,'smtp_configuration_pending');
        $m=new PHPMailer(true);$m->isSMTP();$m->Host=$c['host'];$m->Port=$c['port'];$m->SMTPSecure=$c['encryption'];$m->SMTPAuth=true;$m->Username=$c['user'];$m->Password=$c['password'];$m->SMTPDebug=0;$m->Timeout=30;
        $m->CharSet='UTF-8';$m->setFrom($c['from'],'STATUS TEAM');$m->addAddress($to);$m->Subject=$subject;$m->Body=$body;
        $m->MessageID='<'.$messageId.'@statusteam-official.ru>';$m->send();
    }
    public function work(?callable $transport=null): array {
        $db=$this->app->db;$sent=0;$failed=0;
        // MySQL row lock + expiring lease. PHPMailer timeout < lease; one worker owns each job.
        for($i=0;$i<20;$i++) {
            $job=$db->tx(function() use($db) {
                $r=$db->one("SELECT * FROM mail_queue WHERE ((status='pending' AND available_at<=UTC_TIMESTAMP()) OR (status='sending' AND locked_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 5 MINUTE))) AND attempts<10 ORDER BY id LIMIT 1 FOR UPDATE");
                if(!$r) return null;
                $r['lock_token']=Crypto::id();
                $db->run("UPDATE mail_queue SET status='sending',locked_at=UTC_TIMESTAMP(),lock_token=?,attempts=attempts+1 WHERE id=?",[$r['lock_token'],$r['id']]);return $r;
            });
            if(!$job) break;
            try {
                if($job['kind']==='ticket') {
                    $t=$db->one("SELECT t.token_cipher,t.number FROM tickets t JOIN orders o ON o.id=t.order_id WHERE t.order_id=? AND o.status='paid' AND t.status IN ('valid','used')",[$job['reference_id']]);
                    if(!$t) {
                        $db->run("UPDATE mail_queue SET status='canceled',lock_token=NULL WHERE id=? AND lock_token=?",[$job['id'],$job['lock_token']]);continue;
                    }
                    $subject='Ваш билет на «Пульс Континента»';
                    $body="Ваш билет ".$t['number']."\n\n".$this->app->ticketUrl($this->app->crypto->open($t['token_cipher']))."\n\n30 ноября 2026. Сбор гостей 18:30, начало 20:00 (Москва).\nLOTTE HOTEL MOSCOW, Москва, Новинский бульвар, д. 8, стр. 2.\n18+. Один билет — один проход. Без выбора мест.\nСохраните билет на телефоне или распечатайте.\nПоддержка: ".$this->app->c['support']."\nКассовый чек направляется отдельно.\n";
                } else {
                    $subject='Новая заявка STATUS TEAM';
                    // Applicant data stay in MySQL; authenticated admin reads them in the same Russian infrastructure.
                    $body="Сохранена новая заявка. Откройте защищённый кабинет:\n".$this->app->c['base_url'].'/index.php?r=staff';
                }
                $args=[$this->app->crypto->open($job['recipient']),$subject,$body,'queue-'.$job['id']];
                if($transport) $transport(...$args); else $this->send(...$args);
                $db->run("UPDATE mail_queue SET status='sent',sent_at=UTC_TIMESTAMP(),lock_token=NULL,last_error=NULL WHERE id=? AND lock_token=?",[$job['id'],$job['lock_token']]);$sent++;
            } catch(\Throwable) {
                $attempt=(int)$job['attempts']+1;$delay=min(3600,30*(2**min($attempt,7)));
                $db->run('UPDATE mail_queue SET status=?,available_at=DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND),last_error=?,lock_token=NULL WHERE id=? AND lock_token=?',[$attempt>=10?'failed':'pending',$delay,'smtp_delivery_failed',$job['id'],$job['lock_token']]);$failed++;
            }
        }
        // A worker that crashed on its last attempt leaves an observable failure.
        $db->run("UPDATE mail_queue SET status='failed',last_error='worker_lease_expired',lock_token=NULL WHERE status='sending' AND attempts>=10 AND locked_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 5 MINUTE)");
        return ['sent'=>$sent,'failed'=>$failed];
    }
}
