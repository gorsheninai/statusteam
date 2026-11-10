<?php
declare(strict_types=1);
// This single public bridge is copied to public_html/api/index.php.
// Adapt ONLY this absolute private path after confirming your hosting home directory.
use StatusTeam\{Http,Problem,Validation,Mailer};
ini_set('display_errors','0');
header('Cache-Control: no-store, private');header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
try {
    $app=require dirname(__DIR__,2).'/status-backend/bootstrap.php';
    $route=$_GET['r']??''; $method=$_SERVER['REQUEST_METHOD'];
    if(!is_string($route)) throw new Problem(404,'not_found');
    if($method==='GET') {
        if(in_array($route,['ticket','staff','return'],true)) {
            header('Content-Type: text/html; charset=utf-8');require __DIR__.'/page.php';exit;
        }
        throw new Problem(404,'not_found');
    }
    if($method!=='POST') throw new Problem(405,'post_required');
    $ip=Http::ip($app->c);
    if($route==='webhook') {$app->rate('webhook:'.$ip,600,60);$app->webhook(Http::input());Http::output(['ok'=>true]);}
    if(($_SERVER['HTTP_ORIGIN']??'')!==$app->c['origin']) throw new Problem(403,'origin_denied');
    $app->rate('request:'.$ip,120,60);
    $d=Http::input();
    if($route==='forms' || $route==='orders') {
        $app->rate('submission:'.$ip,15);
        Http::output($route==='forms'?$app->application($d,$ip):$app->order($d,$ip));
    }
    if($route==='order-status') Http::output($app->orderStatus(Validation::text($d,'token',64)));
    if($route==='ticket-data') {
        $token=Validation::text($d,'token',64);$t=$app->ticket($token);
        $qr=new Endroid\QrCode\QrCode(data:$token,size:320,margin:16);
        $uri=(new Endroid\QrCode\Writer\SvgWriter())->write($qr)->getDataUri();
        Http::output(['number'=>$t['number'],'status'=>$t['order_status']==='refund_pending'?'refund_pending':$t['status'],'qr'=>$uri,'support'=>$app->c['support']]);
    }
    Http::session();
    if($route==='session') Http::output(['csrf'=>$_SESSION['csrf']]);
    Http::csrf($d);
    if($route==='login') {
        $app->rate('login:'.$ip,10,900);
        $username=Validation::text($d,'username',80);$password=Validation::text($d,'password',512);
        $app->rate('login-user:'.$username,20,900);
        $s=$app->db->one('SELECT * FROM staff WHERE username=? AND active=1',[$username]);
        $dummy='$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi';
        if(!password_verify($password,$s['password_hash']??$dummy) || !$s) throw new Problem(401,'invalid_login');
        session_regenerate_id(true);$_SESSION=['staff'=>(int)$s['id'],'csrf'=>bin2hex(random_bytes(32)),'last'=>time(),'started'=>time()];
        Http::output(['csrf'=>$_SESSION['csrf'],'role'=>$s['role']]);
    }
    $admin=in_array($route,['refund','resend','dashboard','application-detail','mail-retry'],true);
    $s=Http::staff($app,$admin);session_write_close();
    switch($route) {
        case 'me':Http::output(['role'=>$s['role'],'username'=>$s['username']]);
        case 'logout':Http::session();$_SESSION=[];session_destroy();Http::output(['ok'=>true]);
        case 'check':
            $t=$app->ticketFromCode(Validation::text($d,'token',64));
            Http::output(['number'=>$t['number'],'status'=>$t['order_status']==='refund_pending'?'refund_pending':$t['status']]);
        case 'admit':Http::output($app->admit(Validation::text($d,'token',64),(int)$s['id']));
        case 'refund':
            if(!is_int($d['amountKopecks']??null) || ($d['confirmAmountKopecks']??null)!==$d['amountKopecks']) throw new Problem(422,'confirm_refund_amount');
            Http::output($app->refund(Validation::text($d,'orderId',32),$d['amountKopecks'],Validation::key($d),(int)$s['id']));
        case 'resend':$app->resend(Validation::text($d,'orderId',32),(int)$s['id']);Http::output(['ok'=>true]);
        case 'dashboard':
            Http::output([
                'orders'=>$app->db->run('SELECT o.id,o.status,o.created_at,p.status payment_status,p.receipt_status FROM orders o JOIN payments p ON p.order_id=o.id ORDER BY o.created_at DESC LIMIT 100')->fetchAll(),
                'applications'=>$app->db->run('SELECT id,kind,created_at FROM applications ORDER BY created_at DESC LIMIT 100')->fetchAll(),
                'mail'=>$app->db->run('SELECT id,kind,reference_id,status,attempts,last_error,created_at,sent_at FROM mail_queue ORDER BY id DESC LIMIT 100')->fetchAll(),
                'refunds'=>$app->db->run('SELECT id,order_id,amount,status,receipt_status FROM refunds ORDER BY created_at DESC LIMIT 100')->fetchAll(),
            ]);
        case 'application-detail':
            $id=Validation::text($d,'id',32);$a=$app->db->one('SELECT data,kind FROM applications WHERE id=?',[$id]);
            if(!$a) throw new Problem(404,'not_found');$app->audit((int)$s['id'],'application_viewed',$id);
            Http::output(['kind'=>$a['kind'],'data'=>$app->decode($a['data'])]);
        case 'mail-retry':
            if(!is_int($d['id']??null)) throw new Problem(422,'invalid_id');
            $app->db->run("UPDATE mail_queue SET status='pending',attempts=0,available_at=UTC_TIMESTAMP(),last_error=NULL WHERE id=? AND status='failed'",[$d['id']]);
            $app->audit((int)$s['id'],'mail_retry',(string)$d['id']);Http::output(['ok'=>true]);
        default:throw new Problem(404,'not_found');
    }
} catch(Problem $e) { Http::output(['error'=>$e->getMessage()],$e->status); }
catch(Throwable) { http_response_code(503);header('Content-Type: application/json');echo '{"error":"service_unavailable"}'; }
