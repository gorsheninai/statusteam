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
    $testEntry=defined('STATUS_TEST_ENTRY');
    if (!$testEntry && basename(__FILE__)!=='index.php') {http_response_code(404);exit;}
    $backend=$testEntry ? '/status-backend-test' : '/status-backend';
    $app=require dirname(__DIR__,2).$backend.'/bootstrap.php';
    $testCheckout=$testEntry && ($app->c['test_checkout_enabled']??false)===true
        && $app->c['environment']==='test' && $app->c['yookassa']['test']===true
        && str_starts_with($app->c['yookassa']['secret'],'test_')
        && preg_match('/(?:^|;)dbname=[a-zA-Z0-9_]+_test(?:;|$)/',$app->c['db']['dsn'])===1
        && $app->c['base_url']===$app->c['origin'].'/api-test';
    if ($testEntry && !$testCheckout) throw new Problem(503,'test_checkout_disabled');
    if ($testCheckout) header('X-Robots-Tag: noindex, nofollow');
    $controlCheckout=!$testEntry && $app->controlEnabled();
    $sessionPath=$testCheckout ? '/api-test/' : '/api/';
    $route=$_GET['r']??''; $method=$_SERVER['REQUEST_METHOD'];
    if(!is_string($route)) throw new Problem(404,'not_found');
    if($method==='GET') {
        if (($testCheckout && $route==='purchase') || ($controlCheckout && $route==='control-purchase')) {
            header('X-Robots-Tag: noindex, nofollow');
            Http::session($sessionPath);
            try {
                Http::staff($app,true);
            } catch (Problem $e) {
                if ($e->status!==401) throw $e;
                header('Location: index.php?r=staff', true, 303);
                exit;
            }
            session_write_close();
            $checkoutPage=dirname(__DIR__,2).($route==='control-purchase' ? '/status-backend/control-purchase.html' : '/status-backend-test/test-purchase.html');
            if (!is_file($checkoutPage)) throw new Problem(503,'test_purchase_page_unavailable');
            // The static Next build includes inline bootstrap scripts. This policy applies only to the test purchase page.
            header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
            header('Content-Type: text/html; charset=utf-8');
            readfile($checkoutPage);
            exit;
        }
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
    $controlRoute=in_array($route,['control-order','control-documents'],true);
    if ($controlRoute && !$controlCheckout) throw new Problem(404,'not_found');
    if ($controlRoute || ($testCheckout && in_array($route,['orders','checkout-documents'],true))) {
        Http::session($sessionPath);
        Http::csrf($d);
        Http::staff($app,true);
        session_write_close();
        unset($d['csrf']);
        $app->checkoutReady($controlRoute);
        if (in_array($route,['checkout-documents','control-documents'],true)) {
            $docs=$app->db->run("SELECT id,version,href FROM documents WHERE active=1 AND id IN ('terms','buyers','privacy') ORDER BY id")->fetchAll();
            if (count($docs)!==3 || count(array_unique(array_column($docs,'id')))!==3) throw new Problem(503,'documents_pending');
            Http::output(['documents'=>$docs,'amountKopecks'=>$controlRoute?\StatusTeam\App::CONTROL_PRICE:\StatusTeam\App::PRICE]);
        }
        $app->rate('submission:'.$ip,15);
        Http::output($app->order($d,$ip,$controlRoute));
    }
    if ($route==='public-checkout') {
        if ($testEntry) throw new Problem(404,'not_found');
        $app->checkoutReady();
        $ids=['terms','buyers','privacy'];
        $docs=$app->db->run(
            "SELECT id,version,href FROM documents WHERE active=1 AND id IN ('terms','buyers','privacy')"
        )->fetchAll();
        foreach ($ids as $id) {
            if (count(array_filter($docs, static fn ($doc) => $doc['id']===$id))!==1) {
                throw new Problem(503,'documents_pending');
            }
        }
        Http::output(['documents'=>$docs,'amountKopecks'=>$app->publicPrice(),'launchCheckout'=>$app->launchCheckoutEmail()!=='']);
    }
    if($route==='forms' || $route==='orders') {
        $app->rate('submission:'.$ip,15);
        Http::output($route==='forms'?$app->application($d,$ip):$app->order($d,$ip));
    }
    if($route==='order-status') {
        Http::output($app->orderStatus(Validation::text($d,'token',64),($d['verifyPayment']??false)===true));
    }
    if($route==='ticket-data') {
        $token=Validation::text($d,'token',64);$t=$app->ticket($token);
        $qr=new Endroid\QrCode\QrCode(data:$token,size:320,margin:40);
        $uri=(new Endroid\QrCode\Writer\SvgWriter())->write($qr)->getDataUri();
        Http::output(['number'=>$t['number'],'price'=>\StatusTeam\TicketDetails::price((int)$t['amount']),'orderId'=>$t['order_id'],'control'=>\StatusTeam\App::controlTicket((int)$t['amount'],(bool)$t['launch_ticket']),'status'=>$t['order_status']==='refund_pending'?'refund_pending':$t['status'],'qr'=>$uri,'support'=>$app->c['support']]);
    }
    Http::session($sessionPath);
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
        case 'logout':Http::session($sessionPath);$_SESSION=[];session_destroy();Http::output(['ok'=>true]);
        case 'check':
            $t=$app->ticketFromCode(Validation::text($d,'token',64));
            Http::output(['number'=>$t['number'],'status'=>$t['order_status']==='refund_pending'?'refund_pending':$t['status']]);
        case 'admit':Http::output($app->admit(Validation::text($d,'token',64),(int)$s['id']));
        case 'refund':
            if(!is_int($d['amountKopecks']??null) || ($d['confirmAmountKopecks']??null)!==$d['amountKopecks']) throw new Problem(422,'confirm_refund_amount');
            Http::output($app->refund(Validation::text($d,'orderId',32),$d['amountKopecks'],Validation::key($d),(int)$s['id']));
        case 'resend':$app->resend(Validation::text($d,'orderId',32),(int)$s['id']);Http::output(['ok'=>true]);
        case 'dashboard':
            $orders=$app->db->run('SELECT o.id,o.buyer,o.amount,o.status,o.created_at,p.status payment_status,p.receipt_status,t.number AS ticket_number,t.status AS ticket_status FROM orders o JOIN payments p ON p.order_id=o.id LEFT JOIN tickets t ON t.order_id=o.id ORDER BY o.created_at DESC LIMIT 100')->fetchAll();
            foreach ($orders as &$order) {
                $buyer=$app->decode($order['buyer']);
                unset($order['buyer']);
                $order=[
                    'buyer_name'=>$buyer['name']??'',
                    'buyer_email'=>$buyer['email']??'',
                    'buyer_phone'=>$buyer['phone']??'',
                    'ticket_number'=>$order['ticket_number'],
                    'ticket_status'=>$order['ticket_status'],
                ]+$order;
            }
            unset($order);
            Http::output([
                'orders'=>$orders,
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
