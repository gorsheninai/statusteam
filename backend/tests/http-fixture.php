<?php
declare(strict_types=1);
require __DIR__.'/fixtures.php';
$app=testApp();
$controller='fixture-controller-password';$admin='fixture-admin-password';
$app->db->run('UPDATE staff SET password_hash=?,role=? WHERE id=1',[password_hash($admin,PASSWORD_DEFAULT),'admin']);
$app->db->run('INSERT INTO staff(username,password_hash,role) VALUES(?,?,?)',['fixture-door',password_hash($controller,PASSWORD_DEFAULT),'controller']);
$o=$app->order(purchase(),'127.0.0.1');$app->gateway->overrides[$o['orderId']]=['status'=>'waiting_for_capture','paid'=>true];$app->syncPayment('test-'.$o['orderId']);
$t=$app->db->one('SELECT token_cipher FROM tickets WHERE order_id=?',[$o['orderId']]);
$c=$app->c;$c['forms_enabled']=$c['checkout_enabled']=false;$c['origin']='http://localhost:34311';$c['base_url']='http://localhost:34311/api';
file_put_contents(getenv('HTTP_FIXTURE_CONFIG'),'<?php return '.var_export($c,true).';');chmod(getenv('HTTP_FIXTURE_CONFIG'),0600);
file_put_contents(getenv('HTTP_FIXTURE_JSON'),json_encode(['token'=>$app->crypto->open($t['token_cipher']),'orderId'=>$o['orderId'],'controllerPassword'=>$controller,'adminPassword'=>$admin]));
