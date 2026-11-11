<?php
declare(strict_types=1);
require __DIR__.'/fixtures.php';
use StatusTeam\{Problem,Crypto,Mailer,Http};
if(getenv('TEST_ALLOW_RESET')!=='yes') throw new RuntimeException('TEST_ALLOW_RESET=yes required for disposable fixture DB');
$app=testApp();$db=$app->db;$gateway=$app->gateway;$count=0;
function check(bool $ok,string $description): void {global $count;if(!$ok) throw new RuntimeException('FAILED: '.$description);echo 'PASS '.$description.PHP_EOL;$count++;}
function reject(callable $fn,int $status,string $description): void {try{$fn();}catch(Problem $e){check($e->status===$status,$description);return;}throw new RuntimeException('Expected rejection: '.$description);}
function n(string $table): int {global $db;return (int)$db->one('SELECT COUNT(*) n FROM '.$table)['n'];}
function paid(array $order): string {global $app,$gateway;$id=$order['orderId'];$gateway->overrides[$id]=['status'=>'succeeded','paid'=>true];$app->syncPayment('test-'.$id);return $app->crypto->open($app->db->one('SELECT token_cipher FROM tickets WHERE order_id=?',[$id])['token_cipher']);}
function concurrent(string $kind,int $number,string $token=''): array {
    $ps=[];
    for($i=0;$i<$number;$i++) {$cmd=[PHP_BINARY,'-c',php_ini_loaded_file(),__DIR__.'/worker.php',$kind,$token];$p=proc_open($cmd,[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);fclose($pipes[0]);$ps[]=[$p,$pipes];}
    $results=[];foreach($ps as [$p,$pipes]) {foreach([1,2] as $i){$text=stream_get_contents($pipes[$i]);fclose($pipes[$i]);if($text) throw new RuntimeException('Worker emitted unexpected output');}$results[]=proc_close($p);}return $results;
}
$db->run('SET FOREIGN_KEY_CHECKS=0');
foreach($db->run('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $table) $db->pdo->exec('DROP TABLE `'.str_replace('`','``',$table).'`');
$db->run('SET FOREIGN_KEY_CHECKS=1');
$migrationConfig=tempnam(sys_get_temp_dir(),'status-fixture-');
file_put_contents($migrationConfig,'<?php return '.var_export($app->c,true).';');chmod($migrationConfig,0600);
$migrate=function() use($migrationConfig) {
 $process=proc_open([PHP_BINARY,'-c',php_ini_loaded_file(),dirname(__DIR__).'/bin/console.php','migrate'],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,null,array_merge(getenv(),['STATUS_CONFIG'=>$migrationConfig]));
 fclose($pipes[0]);stream_get_contents($pipes[1]);fclose($pipes[1]);stream_get_contents($pipes[2]);fclose($pipes[2]);return proc_close($process);
};
try {check($migrate()===0,'CLI applies versioned migrations');check($migrate()===0 && n('schema_migrations')===2,'CLI migration rerun is idempotent');} finally {unlink($migrationConfig);}

echo 'DATABASE '.$db->one('SELECT VERSION() version')['version'].PHP_EOL;
foreach(['terms','offer','buyers','privacy','casting','guardian','partner','press'] as $id) $db->run('INSERT INTO documents(id,version,body,sha256,href,active) VALUES(?,?,?,?,?,1)',[$id,'fixture-1','Fixture only — not a legal document',hash('sha256','fixture'),'/fixture/'.$id]);
$db->run('INSERT INTO staff(id,username,password_hash,role) VALUES(1,?,?,?)',['fixture-controller',password_hash(Crypto::id(),PASSWORD_DEFAULT),'admin']);
$d=purchase();unset($d['termsAccepted']);reject(fn()=>$app->order($d,'127.0.0.1'),422,'missing consent rejected');
$d=purchase();$d['consentDocuments'][0]['version']='stale';reject(fn()=>$app->order($d,'127.0.0.1'),409,'stale document rejected');check(n('orders')===0,'invalid checkout leaves no order or reserve');
$d=purchase();$order=$app->order($d,'127.0.0.1');$again=$app->order($d,'127.0.0.1');check($order['orderId']===$again['orderId'] && n('orders')===1,'repeat click uses same order');
$d['email']='changed@example.invalid';reject(fn()=>$app->order($d,'127.0.0.1'),409,'same key with changed payload rejected');
check(n('tickets')===0,'pending payment creates no ticket');
$app->webhook(['event'=>'payment.succeeded','object'=>['id'=>'test-'.$order['orderId'],'status'=>'succeeded']]);check(n('tickets')===0,'forged success body cannot override API pending status');
reject(fn()=>$app->webhook(['event'=>'payment.succeeded','object'=>['id'=>'unknown']]),404,'unknown payment notification rejected');
$gateway->overrides[$order['orderId']]=['status'=>'succeeded','paid'=>true,'amount'=>['value'=>'1.00']];reject(fn()=>$app->syncPayment('test-'.$order['orderId']),409,'wrong amount rejected');
$gateway->overrides[$order['orderId']]=['test'=>false];reject(fn()=>$app->syncPayment('test-'.$order['orderId']),409,'live/test mismatch rejected');
$gateway->overrides[$order['orderId']]=['recipient'=>['account_id'=>'different-shop']];reject(fn()=>$app->syncPayment('test-'.$order['orderId']),409,'different shop rejected');
$token=paid($order);$app->webhook(['event'=>'payment.canceled','object'=>['id'=>'test-'.$order['orderId']]]);check(n('tickets')===1 && n('mail_queue')===1,'duplicate and out-of-order notification use latest API state');
check($app->ticket($token)['status']==='valid','valid ticket retrievable without consumption');
$number=$app->ticket($token)['number'];check($app->ticketFromCode($number)['id']===$app->ticket($token)['id'],'staff manual ticket number resolves same ticket');
reject(fn()=>$app->ticket($number),404,'public ticket cannot be opened using printed number');
$before=n('tickets');$o=$app->order(purchase(),'127.0.0.1');$gateway->overrides[$o['orderId']]=['status'=>'canceled'];$held=(int)$db->one('SELECT held FROM inventory WHERE id=1')['held'];$app->syncPayment('test-'.$o['orderId']);check(n('tickets')===$before && (int)$db->one('SELECT held FROM inventory WHERE id=1')['held']===$held-1,'failed payment releases reserve only after final cancellation');
$o=$app->order(purchase(),'127.0.0.1');$db->run('UPDATE orders SET created_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 30 MINUTE) WHERE id=?',[$o['orderId']]);$late=paid($o);check($app->ticket($late)['status']==='valid','late success after 30 minutes retains reserved place');
// Lost create response: replay exact persisted body/key, never create a fresh key.
$gateway->timeout=true;$d=purchase();$o=$app->order($d,'127.0.0.1');$key=$db->one('SELECT idempotence_key FROM payments WHERE order_id=?',[$o['orderId']])['idempotence_key'];$gateway->timeout=false;$app->order($d,'127.0.0.1');check(end($gateway->keys)===$key,'API timeout retries same persisted payment key');
$gateway->timeout=true;$o=$app->order(purchase(),'127.0.0.1');$gateway->timeout=false;$db->run('UPDATE payments SET created_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 25 HOUR) WHERE order_id=?',[$o['orderId']]);$keys=count($gateway->keys);reject(fn()=>$app->ensurePayment($o['orderId']),503,'unknown payment beyond idempotence window quarantined');check(count($gateway->keys)===$keys,'expired key never sent as a new payment');
// Kill-point equivalent: DB rejects queue insert, proving the ticket and paid state roll back together.
$o=$app->order(purchase(),'127.0.0.1');$gateway->overrides[$o['orderId']]=['status'=>'succeeded','paid'=>true];
$db->pdo->exec("CREATE TRIGGER fixture_fail_queue BEFORE INSERT ON mail_queue FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture failure'");
try {$app->syncPayment('test-'.$o['orderId']);throw new RuntimeException('Expected DB failure');} catch(PDOException) {}
check(!$db->one('SELECT id FROM tickets WHERE order_id=?',[$o['orderId']]) && $db->one('SELECT status FROM orders WHERE id=?',[$o['orderId']])['status']==='reserved','failure between payment and mail rolls back ticket and paid status');
$db->pdo->exec('DROP TRIGGER fixture_fail_queue');$app->syncPayment('test-'.$o['orderId']);check((bool)$db->one('SELECT id FROM tickets WHERE order_id=?',[$o['orderId']]),'reconciliation recovers interrupted issue');
$ticketCount=n('tickets');$m=new Mailer($app);$result=$m->work(function(){throw new RuntimeException('fixture SMTP down');});check($result['failed']>0 && n('tickets')===$ticketCount,'SMTP failure preserves ticket and queued job');
$db->run("UPDATE mail_queue SET available_at=UTC_TIMESTAMP() WHERE status='pending'");$sent=[];$m->work(function(...$args)use(&$sent){$sent[]=$args;});check(count($sent)>0 && n('tickets')===$ticketCount,'SMTP retry sends same tickets');
$app->resend($order['orderId'],1);$m->work(function(...$args)use(&$sent){$sent[]=$args;});check(n('tickets')===$ticketCount,'manual resend does not issue a ticket');
// Real MySQL multi-process lock contention.
$app=null;$db=null;$gateway=null;
$app=testApp();$db=$app->db;$db->run('UPDATE inventory SET capacity=held+1 WHERE id=1');
$app=null;$db=null;$results=concurrent('purchase',8);$app=testApp();$db=$app->db;$gateway=$app->gateway;
check(count(array_filter($results,fn($x)=>$x===0))===1 && count(array_filter($results,fn($x)=>$x===2))===7,'eight simultaneous buyers compete for one place on MySQL');
check($db->one('SELECT held=capacity ok FROM inventory WHERE id=1')['ok']==1,'inventory never exceeds capacity');
$app=null;$db=null;$gateway=null;$results=concurrent('admit',6,$token);$app=testApp();$db=$app->db;$gateway=$app->gateway;
check(count(array_filter($results,fn($x)=>$x===0))===1 && n('admissions')===1,'six simultaneous scans allow exactly one admission on MySQL');
reject(fn()=>$app->admit($token,1),409,'second admission rejected');
$db->run('UPDATE inventory SET capacity=100 WHERE id=1');
$o=$app->order(purchase(),'127.0.0.1');$tokenRefund=paid($o);
reject(fn()=>$app->refund($o['orderId'],100,Crypto::id().Crypto::id(),1),409,'partial refund blocked until approved policy');
$key=bin2hex(random_bytes(32));$r=$app->refund($o['orderId'],2500000,$key,1);check($r['status']==='succeeded' && $app->ticket($tokenRefund)['status']==='refunded','full refund invalidates ticket');
$r2=$app->refund($o['orderId'],2500000,$key,1); // Fake GET refund not provided; terminal should not call provider again (see ensureRefund).
check($r2['id']===$r['id'] && n('refunds')===1,'refund request idempotent');
reject(fn()=>$app->admit($tokenRefund,1),409,'refunded ticket cannot enter');
// Indeterminate and canceled refunds keep access safe and recover using their original key.
$o=$app->order(purchase(),'127.0.0.1');$pendingToken=paid($o);$gateway->timeout=true;$k=bin2hex(random_bytes(32));
$r=$app->refund($o['orderId'],2500000,$k,1);reject(fn()=>$app->admit($pendingToken,1),409,'uncertain refund blocks admission');
$gateway->timeout=false;$gateway->refundStatus='canceled';$app->ensureRefund($r['id']);check($app->ticket($pendingToken)['order_status']==='paid','canceled refund restores order access');
$gateway->refundStatus='succeeded';
foreach(['keep','void'] as $policy) {
 $app->c['partial_refund_policy']=$policy;$o=$app->order(purchase(),'127.0.0.1');$partial=paid($o);
 $app->refund($o['orderId'],100,bin2hex(random_bytes(32)),1);
 check($app->ticket($partial)['status']===($policy==='keep'?'valid':'refunded'),'approved partial refund policy '.$policy.' enforced');
}
$app->c['partial_refund_policy']='disabled';
$o=$app->order(purchase(),'127.0.0.1');$external=paid($o);$gateway->refunds['external-fixture']=['id'=>'external-fixture','payment_id'=>'test-'.$o['orderId'],'amount'=>['value'=>'25000.00','currency'=>'RUB'],'status'=>'succeeded'];
$app->webhook(['event'=>'refund.succeeded','object'=>['id'=>'external-fixture']]);check($app->ticket($external)['status']==='refunded','verified merchant-panel refund imported and invalidates ticket');
$o=$app->order(purchase(),'127.0.0.1');$missingWebhook=paid($o);$gateway->overrides[$o['orderId']]['refunded_amount']=['value'=>'25000.00','currency'=>'RUB'];$app->syncPayment('test-'.$o['orderId']);reject(fn()=>$app->admit($missingWebhook,1),409,'provider refunded total blocks entry even without refund webhook');
$o=$app->order(purchase(),'127.0.0.1');$unresolved=paid($o);$app->c['partial_refund_policy']='keep';
$gateway->overrides[$o['orderId']]['refunded_amount']=['value'=>'25000.00','currency'=>'RUB'];
$gateway->refunds['external-partial']=['id'=>'external-partial','payment_id'=>'test-'.$o['orderId'],'amount'=>['value'=>'1.00','currency'=>'RUB'],'status'=>'succeeded'];
$app->syncRefund('external-partial');reject(fn()=>$app->admit($unresolved,1),409,'partial refund sync cannot reopen entry while provider total remains unresolved');$app->c['partial_refund_policy']='disabled';
$form=['requestKey'=>bin2hex(random_bytes(32)),'form'=>'partner','company'=>'Fixture','name'=>'Test Partner','contact'=>'partner@example.invalid','termsAccepted'=>'yes','consent'=>'yes','consentDocuments'=>documents(['terms','privacy','partner'])];
$a=$app->application($form,'127.0.0.1');$app->application($form,'127.0.0.1');check(n('applications')===1,'application and consents persist once with mail retry key');
check(n('consent_documents')>=3,'consent records reference immutable document snapshots');
$minor=['requestKey'=>bin2hex(random_bytes(32)),'form'=>'casting','name'=>'Test Model','age'=>'17','city'=>'Fixture','height'=>'170','contact'=>'@fixture_model','termsAccepted'=>'yes','consent'=>'yes','consentSubject'=>'guardian','consentDocuments'=>documents(['terms','privacy','guardian'])];
reject(fn()=>$app->application($minor,'127.0.0.1'),503,'minor form blocked pending approval');
$app->c['minor_forms_enabled']=true;reject(fn()=>$app->application($minor,'127.0.0.1'),422,'guardian identity and authority fields required');
$minor+=['guardianName'=>'Test Guardian Person','guardianRole'=>'parent','guardianPhone'=>'+70000000000','guardianEmail'=>'guardian@example.invalid','guardianAuthority'=>'yes'];
$app->application($minor,'127.0.0.1');check(n('applications')===2,'approved guardian form stored with separate consent snapshot');
$form['form']='subscribe';reject(fn()=>$app->application($form,'127.0.0.1'),422,'newsletter is disabled server-side');
$_SERVER=['REMOTE_ADDR'=>'127.0.0.1','HTTP_X_FORWARDED_FOR'=>'1.2.3.4'];check(Http::ip($app->c)==='127.0.0.1','untrusted forwarded IP ignored');
$qr=(new Endroid\QrCode\Writer\SvgWriter())->write(new Endroid\QrCode\QrCode(data:$tokenRefund,size:320));check(str_contains($qr->getString(),'<svg'),'locked QR dependency produces local SVG');
$app->c['environment']='live';$app->c['yookassa']['test']=false;reject(fn()=>$app->checkoutReady(),503,'unapproved live fiscal settings block checkout');
echo 'TOTAL '.$count." passed\n";
