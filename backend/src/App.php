<?php
declare(strict_types=1);
namespace StatusTeam;
final class App {
    public const PRICE=2500000;
    public function __construct(public Db $db,public array $c,public Crypto $crypto,public Gateway $gateway) {}
    public static function json(mixed $v): string {return json_encode($v,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);}
    public function decode(string $v): array {return json_decode($this->crypto->open($v),true,512,JSON_THROW_ON_ERROR);}
    private function fingerprint(array $d): string {ksort($d);return Crypto::hash(self::json($d));}
    public function rate(string $bucket,int $limit,int $seconds=600): void {
        $key=hash_hmac('sha256',$bucket,$this->c['key']);
        $this->db->run('INSERT INTO rate_limits(bucket,hits,expires_at) VALUES(?,1,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE hits=IF(expires_at<UTC_TIMESTAMP(),1,hits+1), expires_at=IF(expires_at<UTC_TIMESTAMP(),VALUES(expires_at),expires_at)',[$key,$seconds]);
        if((int)$this->db->one('SELECT hits FROM rate_limits WHERE bucket=?',[$key])['hits']>$limit) throw new Problem(429,'rate_limited');
    }
    public function documents(array $d,array $ids): array {
        if(!$this->c['documents_approved']) throw new Problem(503,'documents_pending');
        $received=$d['consentDocuments']??null;
        if(!is_array($received) || count($received)!==count($ids)) throw new Problem(422,'documents_required');
        $map=[];
        foreach($received as $r) {
            if(!is_array($r) || !is_string($r['id']??null) || !is_string($r['version']??null) || isset($map[$r['id']])) throw new Problem(422,'invalid_documents');
            $map[$r['id']]=$r['version'];
        }
        $out=[];
        foreach($ids as $id) {
            $doc=$this->db->one('SELECT id,version FROM documents WHERE id=? AND active=1',[$id]);
            if(!$doc) throw new Problem(503,'documents_pending');
            if(($map[$id]??null)!==$doc['version']) throw new Problem(409,'document_version_changed');
            $out[]=$doc;
        }
        return $out;
    }
    private function consent(string $kind,array $docs,array $data,string $ip,?string $application,?string $order): void {
        $marks=['termsAccepted'=>true,'documentsAcknowledged'=>array_column($docs,'id')];
        foreach(['consent','advertisingConsent','guardianAuthority','consentSubject'] as $k) if(isset($data[$k])) $marks[$k]=$data[$k];
        $contact=array_intersect_key($data,array_flip(['name','contact','email','phone','guardianName','guardianRole','guardianPhone','guardianEmail']));
        $this->db->run('INSERT INTO consents(application_id,order_id,kind,contact,ip,marks) VALUES(?,?,?,?,?,?)',[$application,$order,$kind,$this->crypto->seal(self::json($contact)),$ip,self::json($marks)]);
        $id=$this->db->pdo->lastInsertId();
        foreach($docs as $doc) $this->db->run('INSERT INTO consent_documents(consent_id,document_id,version) VALUES(?,?,?)',[$id,$doc['id'],$doc['version']]);
    }
    public function queue(string $dedupe,string $kind,string $reference,string $recipient): void {
        $this->db->run('INSERT INTO mail_queue(dedupe,kind,reference_id,recipient) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE id=id',[$dedupe,$kind,$reference,$this->crypto->seal($recipient)]);
    }
    public function application(array $d,string $ip): array {
        if(!$this->c['forms_enabled']) throw new Problem(503,'forms_disabled');
        if(!empty($d['website'])) throw new Problem(422,'invalid_submission');
        $key=Validation::key($d);[$kind,$v,$ids]=Validation::application($d,$this->c['minor_forms_enabled']);
        $hash=$this->fingerprint($d);
        return $this->db->tx(function() use($d,$ip,$key,$kind,$v,$ids,$hash) {
            // Small shared lock serializes retries on MySQL 5.7 as well as 8.0.
            $this->db->one('SELECT id FROM inventory WHERE id=1 FOR UPDATE');
            $old=$this->db->one('SELECT id,request_hash FROM applications WHERE request_key=?',[$key]);
            if($old) {if($old['request_hash']!==$hash) throw new Problem(409,'retry_payload_changed');return ['id'=>$old['id']];}
            $docs=$this->documents($d,$ids);$id=Crypto::id();
            $this->db->run('INSERT INTO applications(id,request_key,request_hash,kind,data) VALUES(?,?,?,?,?)',[$id,$key,$hash,$kind,$this->crypto->seal(self::json($v))]);
            $this->consent($kind,$docs,$d,$ip,$id,null);
            if(!$this->c['application_recipient']) throw new Problem(503,'recipient_pending');
            $this->queue('application:'.$id,'application',$id,$this->c['application_recipient']);
            return ['id'=>$id];
        });
    }
    public function checkoutReady(): void {
        if(!$this->c['checkout_enabled'] || !$this->c['support'] || !$this->c['documents_approved']) throw new Problem(503,'checkout_disabled');
        $y=$this->c['yookassa']; $f=$this->c['fiscal'];
        if(!$y['shop_id'] || !$y['secret']) throw new Problem(503,'payment_configuration_pending');
        if($this->c['environment']!=='test' && $this->c['environment']!=='live') throw new Problem(503,'invalid_environment');
        if(($this->c['environment']==='test')!==$y['test']) throw new Problem(503,'payment_mode_mismatch');
        if(!$y['test'] && (!$this->c['live_approved'] || !$f['approved'] || $f['payment_mode']!=='full_payment')) throw new Problem(503,'live_not_approved');
        if($f['integration']!=='payment_with_receipt' || !is_int($f['tax_system_code']) || $f['tax_system_code']<1 || $f['tax_system_code']>6 || !is_int($f['vat_code']) || $f['vat_code']<1 || $f['vat_code']>12 || !$f['payment_subject'] || !$f['payment_mode'] || !$f['refund_payment_mode']) throw new Problem(503,'fiscal_configuration_pending');
    }
    private function receipt(array $buyer,int $amount,bool $refund=false): array {
        $f=$this->c['fiscal'];
        return ['customer'=>['email'=>$buyer['email']],'tax_system_code'=>$f['tax_system_code'],'items'=>[['description'=>'Билет на шоу «Пульс Континента» 30.11.2026','quantity'=>'1.00','amount'=>['value'=>sprintf('%d.%02d',intdiv($amount,100),$amount%100),'currency'=>'RUB'],'vat_code'=>$f['vat_code'],'payment_subject'=>$f['payment_subject'],'payment_mode'=>$refund?$f['refund_payment_mode']:$f['payment_mode']]]];
    }
    public function order(array $d,string $ip): array {
        $this->checkoutReady();$key=Validation::key($d);
        if(($d['termsAccepted']??'')!=='yes' || !empty($d['website'])) throw new Problem(422,'consent_required');
        $buyer=['name'=>Validation::text($d,'name'),'email'=>Validation::email(Validation::text($d,'email',254)),'phone'=>Validation::phone(Validation::text($d,'phone',32))];
        if(count(preg_split('/\s+/u',$buyer['name']))<2) throw new Problem(422,'name_and_surname_required');
        $hash=$this->fingerprint($d);$access=$this->crypto->capability($key);
        $id=$this->db->tx(function() use($d,$ip,$key,$hash,$buyer,$access) {
            $inventory=$this->db->one('SELECT * FROM inventory WHERE id=1 FOR UPDATE');
            $old=$this->db->one('SELECT id,request_hash FROM orders WHERE request_key=?',[$key]);
            if($old) {if($old['request_hash']!==$hash) throw new Problem(409,'retry_payload_changed');return $old['id'];}
            $docs=$this->documents($d,['terms','offer','buyers','privacy']);
            if($inventory['held']>=$inventory['capacity']) throw new Problem(409,'sold_out');
            $id=Crypto::id();$paymentKey=Crypto::id();
            $body=['amount'=>['value'=>sprintf('%d.%02d',intdiv(self::PRICE,100),self::PRICE%100),'currency'=>'RUB'],'capture'=>true,'confirmation'=>['type'=>'redirect','return_url'=>$this->c['origin'].'/api/index.php?r=return#'.$access],'metadata'=>['order_id'=>$id],'description'=>'STATUS TEAM '.$id,'receipt'=>$this->receipt($buyer,self::PRICE)];
            $this->db->run('INSERT INTO orders(id,request_key,request_hash,buyer,amount,access_hash) VALUES(?,?,?,?,?,?)',[$id,$key,$hash,$this->crypto->seal(self::json($buyer)),self::PRICE,Crypto::hash($access)]);
            $this->db->run('UPDATE inventory SET held=held+1 WHERE id=1');
            $this->consent('purchase',$docs,$d,$ip,null,$id);
            $this->db->run('INSERT INTO payments(order_id,idempotence_key,request_body) VALUES(?,?,?)',[$id,$paymentKey,$this->crypto->seal(self::json($body))]);
            return $id;
        });
        try {$this->ensurePayment($id);} catch(Problem $e) {if($e->status!==503) throw $e;}
        return $this->orderStatus($access)+['accessToken'=>$access];
    }
    public function ensurePayment(string $id): void {
        $p=$this->db->one('SELECT * FROM payments WHERE order_id=?',[$id]);
        if(!$p) throw new Problem(404,'order_not_found');
        if($p['provider_id']) {$this->syncPayment($p['provider_id']);return;}
        // Provider only guarantees idempotence for 24h. Leave reserve in manual review after 23h.
        if(strtotime($p['created_at'])<time()-23*3600) {
            $this->db->run("UPDATE payments SET status='manual_review' WHERE order_id=? AND provider_id IS NULL",[$id]);
            throw new Problem(503,'payment_manual_review');
        }
        $v=$this->gateway->call('POST','/payments',$this->decode($p['request_body']),$p['idempotence_key']);
        $this->applyPayment($v,$id);
    }
    private function verifyPayment(array $v,string $id,?string $providerId,int $orderAmount): void {
        if(!is_string($v['id']??null) || !preg_match('/^[a-zA-Z0-9-]{1,64}$/D',$v['id']) || ($providerId && $v['id']!==$providerId) || ($v['metadata']['order_id']??null)!==$id || ($v['recipient']['account_id']??null)!==(string)$this->c['yookassa']['shop_id'] || ($v['test']??null)!==$this->c['yookassa']['test'] || Validation::amount($v['amount']??[])!==$orderAmount || !in_array($v['status']??'', ['pending','waiting_for_capture','succeeded','canceled'],true) || ($v['status']==='succeeded' && ($v['paid']??false)!==true)) throw new Problem(409,'payment_verification_failed');
    }
    public function syncPayment(string $providerId): array {
        $p=$this->db->one('SELECT order_id FROM payments WHERE provider_id=?',[$providerId]);
        if(!$p) throw new Problem(404,'unknown_payment');
        $v=$this->gateway->call('GET','/payments/'.$providerId);
        if(($v['id']??null)!==$providerId) throw new Problem(409,'payment_verification_failed');
        $this->applyPayment($v,$p['order_id']);return $v;
    }
    public function applyPayment(array $v,string $id): void {
        $this->db->tx(function() use($v,$id) {
            // Always inventory -> order -> payment -> ticket; refunds/admissions never request inventory lock.
            $this->db->one('SELECT * FROM inventory WHERE id=1 FOR UPDATE');
            $o=$this->db->one('SELECT * FROM orders WHERE id=? FOR UPDATE',[$id]);
            $p=$this->db->one('SELECT * FROM payments WHERE order_id=? FOR UPDATE',[$id]);
            if(!$o || !$p) throw new Problem(404,'unknown_order');
            $this->verifyPayment($v,$id,$p['provider_id'],(int)$o['amount']);
            if(in_array($p['status'],['succeeded','canceled'],true) && $p['status']!==$v['status']) throw new Problem(409,'payment_terminal_conflict');
            $url=$v['confirmation']['confirmation_url']??null;
            if($url!==null && (!is_string($url) || parse_url($url,PHP_URL_SCHEME)!=='https' || !preg_match('/(^|\.)yookassa\.ru$/D',parse_url($url,PHP_URL_HOST)??''))) throw new Problem(409,'invalid_confirmation_url');
            $this->db->run('UPDATE payments SET provider_id=?,status=?,confirmation_url=COALESCE(?,confirmation_url),receipt_status=?,checked_at=UTC_TIMESTAMP() WHERE order_id=?',[$v['id'],$v['status'],$url,$v['receipt_registration']??null,$id]);
            if($v['status']==='succeeded' && $o['status']==='reserved') {
                $token=bin2hex(random_bytes(32));$ticket=Crypto::id();
                $this->db->run("UPDATE orders SET status='paid',updated_at=UTC_TIMESTAMP() WHERE id=?",[$id]);
                $this->db->run('INSERT INTO tickets(id,order_id,number,token_hash,token_cipher) VALUES(?,?,?,?,?)',[$ticket,$id,'ST-'.strtoupper(substr($ticket,0,16)),Crypto::hash($token),$this->crypto->seal($token)]);
                $this->queue('ticket:'.$id,'ticket',$id,$this->decode($o['buyer'])['email']);
            }
            // A refund made in the merchant panel must also block entry if its webhook was lost.
            if($v['status']==='succeeded' && isset($v['refunded_amount'])) {
                $providerRefunded=Validation::amount($v['refunded_amount']);
                $localRefunded=(int)$this->db->one("SELECT COALESCE(SUM(amount),0) total FROM refunds WHERE order_id=? AND status='succeeded'",[$id])['total'];
                if($providerRefunded>$localRefunded) $this->db->run("UPDATE orders SET status='refund_pending' WHERE id=? AND status<>'refunded'",[$id]);
            }
            if($v['status']==='canceled' && $o['status']==='reserved') {
                $this->db->run("UPDATE orders SET status='canceled',updated_at=UTC_TIMESTAMP() WHERE id=?",[$id]);
                $this->db->run('UPDATE inventory SET held=held-1 WHERE id=1');
            }
        });
    }
    public function orderStatus(string $token): array {
        $o=$this->db->one('SELECT o.id,o.status,p.confirmation_url,p.status payment_status FROM orders o JOIN payments p ON p.order_id=o.id WHERE access_hash=?',[Crypto::hash($token)]);
        if(!$o) throw new Problem(404,'order_not_found');
        $result=['orderId'=>$o['id'],'status'=>$o['status'],'paymentStatus'=>$o['payment_status'],'confirmationUrl'=>$o['status']==='reserved'?$o['confirmation_url']:null];
        if($o['status']==='paid') {
            $t=$this->db->one('SELECT token_cipher FROM tickets WHERE order_id=?',[$o['id']]);
            if($t) $result['ticketUrl']=$this->ticketUrl($this->crypto->open($t['token_cipher']));
        }
        return $result;
    }
    public function ticketUrl(string $token): string {return $this->c['base_url'].'/index.php?r=ticket#'.$token;}
    public function ticket(string $token): array {
        if(!preg_match('/^[a-f0-9]{64}$/D',$token)) throw new Problem(404,'ticket_not_found');
        $t=$this->db->one('SELECT t.*,o.status order_status FROM tickets t JOIN orders o ON o.id=t.order_id WHERE token_hash=?',[Crypto::hash($token)]);
        if(!$t) throw new Problem(404,'ticket_not_found');return $t;
    }
    // Human-readable random ticket number is searchable only behind staff authentication.
    public function ticketFromCode(string $code): array {
        if(preg_match('/^ST-[A-F0-9]{16}$/D',strtoupper($code))) {
            $t=$this->db->one('SELECT token_cipher FROM tickets WHERE number=?',[strtoupper($code)]);
            if(!$t) throw new Problem(404,'ticket_not_found');return $this->ticket($this->crypto->open($t['token_cipher']));
        }
        return $this->ticket($code);
    }
    public function admit(string $token,int $staff): array {
        $t=$this->ticketFromCode($token);
        return $this->db->tx(function() use($t,$staff) {
            $o=$this->db->one('SELECT status FROM orders WHERE id=? FOR UPDATE',[$t['order_id']]);
            $v=$this->db->one('SELECT status FROM tickets WHERE id=? FOR UPDATE',[$t['id']]);
            if($o['status']!=='paid' || $v['status']!=='valid') throw new Problem(409,$v['status']==='used'?'used':'invalid_ticket');
            $this->db->run("UPDATE tickets SET status='used' WHERE id=?",[$t['id']]);
            $this->db->run('INSERT INTO admissions(ticket_id,staff_id) VALUES(?,?)',[$t['id'],$staff]);
            return ['status'=>'admitted'];
        });
    }
    public function audit(int $staff,string $action,string $id): void {$this->db->run('INSERT INTO staff_audit(staff_id,action,reference_id) VALUES(?,?,?)',[$staff,$action,$id]);}
    public function refund(string $order,int $amount,string $key,int $staff): array {
        $this->checkoutReady();
        if(!preg_match('/^[a-f0-9]{64}$/D',$key)) throw new Problem(422,'invalid_request_key');
        $r=$this->db->tx(function() use($order,$amount,$key,$staff) {
            $o=$this->db->one('SELECT * FROM orders WHERE id=? FOR UPDATE',[$order]);
            if(!$o) throw new Problem(404,'order_not_found');
            $old=$this->db->one('SELECT * FROM refunds WHERE request_key=?',[$key]);
            if($old) {if($old['order_id']!==$order || (int)$old['amount']!==$amount) throw new Problem(409,'retry_payload_changed'); return $old;}
            if($o['status']!=='paid') throw new Problem(409,'order_not_paid');
            if($this->db->one("SELECT id FROM refunds WHERE order_id=? AND status NOT IN ('succeeded','canceled')",[$order])) throw new Problem(409,'refund_pending');
            $sum=(int)$this->db->one("SELECT COALESCE(SUM(amount),0) total FROM refunds WHERE order_id=? AND status='succeeded'",[$order])['total'];
            $left=(int)$o['amount']-$sum;
            if($amount<100 || $amount>$left || ($left-$amount>0 && $left-$amount<100)) throw new Problem(422,'invalid_refund_amount');
            if($amount<$left && !in_array($this->c['partial_refund_policy'],['keep','void'],true)) throw new Problem(409,'partial_refunds_not_approved');
            $p=$this->db->one('SELECT provider_id FROM payments WHERE order_id=?',[$order]);$id=Crypto::id();
            $body=['payment_id'=>$p['provider_id'],'amount'=>['value'=>sprintf('%d.%02d',intdiv($amount,100),$amount%100),'currency'=>'RUB'],'receipt'=>$this->receipt($this->decode($o['buyer']),$amount,true)];
            $this->db->run('INSERT INTO refunds(id,order_id,staff_id,request_key,amount,request_body) VALUES(?,?,?,?,?,?)',[$id,$order,$staff,$key,$amount,$this->crypto->seal(self::json($body))]);
            $this->db->run("UPDATE orders SET status='refund_pending' WHERE id=?",[$order]);
            $this->audit($staff,'refund_requested',$id);
            return $this->db->one('SELECT * FROM refunds WHERE id=?',[$id]);
        });
        try {$this->ensureRefund($r['id']);} catch(Problem $e) {if($e->status!==503) throw $e;}
        return $this->db->one('SELECT id,status,amount FROM refunds WHERE id=?',[$r['id']]);
    }
    public function ensureRefund(string $id): void {
        $r=$this->db->one('SELECT * FROM refunds WHERE id=?',[$id]);if(!$r) throw new Problem(404,'refund_not_found');
        if(in_array($r['status'],['succeeded','canceled'],true)) return;
        if($r['provider_id']) {$this->applyRefund($this->gateway->call('GET','/refunds/'.$r['provider_id']),$id);return;}
        if(strtotime($r['created_at'])<time()-23*3600) {
            $this->db->run("UPDATE refunds SET status='manual_review' WHERE id=?",[$id]);throw new Problem(503,'refund_manual_review');
        }
        $v=$this->gateway->call('POST','/refunds',$this->decode($r['request_body']),$id);$this->applyRefund($v,$id);
    }
    public function applyRefund(array $v,string $id): void {
        $r=$this->db->one('SELECT * FROM refunds WHERE id=?',[$id]);if(!$r) throw new Problem(404,'refund_not_found');
        $p=$this->db->one('SELECT provider_id FROM payments WHERE order_id=?',[$r['order_id']]);
        // Recheck the parent through our shop credentials, including live/test mode and amount.
        $parent=$this->syncPayment($p['provider_id']);
        $this->db->tx(function() use($r,$v,$id,$p,$parent) {
            $o=$this->db->one('SELECT * FROM orders WHERE id=? FOR UPDATE',[$r['order_id']]);
            $current=$this->db->one('SELECT * FROM refunds WHERE id=? FOR UPDATE',[$id]);
            if(!is_string($v['id']??null) || !preg_match('/^[a-zA-Z0-9-]{1,64}$/D',$v['id']) || ($current['provider_id'] && $current['provider_id']!==$v['id']) || ($v['payment_id']??null)!==$p['provider_id'] || Validation::amount($v['amount']??[])!==(int)$r['amount'] || !in_array($v['status']??'', ['pending','succeeded','canceled'],true)) throw new Problem(409,'refund_verification_failed');
            if(in_array($current['status'],['succeeded','canceled'],true) && $current['status']!==$v['status']) throw new Problem(409,'refund_terminal_conflict');
            $this->db->run('UPDATE refunds SET provider_id=?,status=?,receipt_status=?,checked_at=UTC_TIMESTAMP() WHERE id=?',[$v['id'],$v['status'],$v['receipt_registration']??null,$id]);
            if($v['status']==='pending') return;
            $sum=(int)$this->db->one("SELECT COALESCE(SUM(amount),0) total FROM refunds WHERE order_id=? AND status='succeeded'",[$o['id']])['total'];
            $void=$sum>=(int)$o['amount'] || ($sum>0 && $this->c['partial_refund_policy']!=='keep');
            $pending=(bool)$this->db->one("SELECT id FROM refunds WHERE order_id=? AND status NOT IN ('succeeded','canceled') LIMIT 1",[$o['id']]);
            $unresolvedTotal=isset($parent['refunded_amount']) && Validation::amount($parent['refunded_amount'])>$sum;
            $this->db->run('UPDATE orders SET status=? WHERE id=?',[$void?'refunded':(($pending || $unresolvedTotal)?'refund_pending':'paid'),$o['id']]);
            if($void) $this->db->run("UPDATE tickets SET status='refunded' WHERE order_id=?",[$o['id']]);
            // Refunded inventory is deliberately not re-sold automatically.
        });
    }
    public function webhook(array $d): void {
        $event=$d['event']??'';$id=$d['object']['id']??'';
        if(!is_string($id) || !preg_match('/^[a-zA-Z0-9-]{1,64}$/D',$id)) throw new Problem(422,'invalid_notification');
        if(in_array($event,['payment.succeeded','payment.canceled','payment.waiting_for_capture'],true)) {$this->syncPayment($id);return;}
        if($event==='refund.succeeded') {
            $this->syncRefund($id);return;
        }
        throw new Problem(422,'unsupported_event');
    }
    public function syncRefund(string $providerId): void {
        $v=$this->gateway->call('GET','/refunds/'.$providerId);
        if(($v['id']??null)!==$providerId || !is_string($v['payment_id']??null)) throw new Problem(409,'refund_verification_failed');
        $amount=Validation::amount($v['amount']??[]);
        $p=$this->db->one('SELECT order_id FROM payments WHERE provider_id=?',[$v['payment_id']]);
        if(!$p || $amount<100) throw new Problem(404,'unknown_refund');
        $this->syncPayment($v['payment_id']);
        $id=$this->db->tx(function() use($v,$p,$amount,$providerId) {
            $o=$this->db->one('SELECT * FROM orders WHERE id=? FOR UPDATE',[$p['order_id']]);
            $r=$this->db->one('SELECT id FROM refunds WHERE provider_id=?',[$providerId]);if($r) return $r['id'];
            // Resolve a lost create response before treating a refund as an external operation.
            $pending=$this->db->one("SELECT id FROM refunds WHERE order_id=? AND provider_id IS NULL AND amount=? AND status IN ('creating','manual_review')",[$o['id'],$amount]);
            if($pending) {
                $this->db->run('UPDATE refunds SET provider_id=? WHERE id=?',[$providerId,$pending['id']]);return $pending['id'];
            }
            $sum=(int)$this->db->one("SELECT COALESCE(SUM(amount),0) total FROM refunds WHERE order_id=? AND status<>'canceled'",[$o['id']])['total'];
            if($sum+$amount>(int)$o['amount']) throw new Problem(409,'refund_total_conflict');
            $id=Crypto::id();
            $this->db->run('INSERT INTO refunds(id,order_id,staff_id,request_key,provider_id,amount,request_body) VALUES(?,?,NULL,?,?,?,?)',[$id,$o['id'],Crypto::hash('external:'.$providerId),$providerId,$amount,$this->crypto->seal('{}')]);
            $this->db->run("UPDATE orders SET status='refund_pending' WHERE id=?",[$o['id']]);return $id;
        });
        $this->applyRefund($v,$id);
    }
    public function reconcile(): array {
        $count=0;$errors=0;
        foreach($this->db->run("SELECT order_id FROM payments WHERE status<>'canceled' ORDER BY COALESCE(checked_at,created_at) LIMIT 100")->fetchAll() as $p) {
            try {$this->ensurePayment($p['order_id']);$count++;} catch(\Throwable) {$errors++;}
        }
        foreach($this->db->run("SELECT id FROM refunds WHERE status NOT IN ('succeeded','canceled') ORDER BY COALESCE(checked_at,created_at) LIMIT 100")->fetchAll() as $r) {
            try {$this->ensureRefund($r['id']);$count++;} catch(\Throwable) {$errors++;}
        }
        return ['processed'=>$count,'needsAttention'=>$errors];
    }
    public function resend(string $order,int $staff): void {
        $o=$this->db->one("SELECT buyer FROM orders WHERE id=? AND status='paid'",[$order]);
        if(!$o) throw new Problem(409,'order_not_paid');
        $this->db->tx(function() use($o,$order,$staff) {
            $this->queue('resend:'.Crypto::id(),'ticket',$order,$this->decode($o['buyer'])['email']);
            $this->audit($staff,'ticket_resent',$order);
        });
    }
}
