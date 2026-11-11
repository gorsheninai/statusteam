<?php
declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
use StatusTeam\{App,Db,Crypto,Gateway};
final class FakeGateway implements Gateway {
    public array $overrides=[];
    public bool $timeout=false;
    public array $keys=[];
    public array $refunds=[];
    public string $refundStatus='succeeded';
    public function call(string $method,string $path,?array $body=null,?string $key=null): array {
        if($key) $this->keys[]=$key;
        if($this->timeout) throw new StatusTeam\Problem(503,'fixture_timeout');
        if($path==='/payments') return $this->payment($body['metadata']['order_id']);
        if(str_starts_with($path,'/payments/')) return $this->payment(substr($path,strlen('/payments/test-')));
        if($path==='/refunds') { $id='refund-'.$key;return $this->refunds[$id]=['id'=>$id,'payment_id'=>$body['payment_id'],'amount'=>$body['amount'],'status'=>$this->refundStatus,'receipt_registration'=>'succeeded']; }
        if(str_starts_with($path,'/refunds/')) return array_replace($this->refunds[substr($path,9)],['status'=>$this->refundStatus]);
        throw new RuntimeException('Unexpected fake call');
    }
    public function payment(string $order,string $status='pending'): array {
        $base=['id'=>'test-'.$order,'metadata'=>['order_id'=>$order],'recipient'=>['account_id'=>'fixture-shop'],'test'=>true,'amount'=>['value'=>'25000.00','currency'=>'RUB'],'status'=>$status,'paid'=>$status==='succeeded','receipt_registration'=>'succeeded','confirmation'=>['confirmation_url'=>'https://yookassa.ru/checkout/fixture']];
        return array_replace_recursive($base,$this->overrides[$order]??[]);
    }
}
function testApp(): App {
    $c=require dirname(__DIR__).'/config.example.php';
    $dsn=getenv('TEST_MYSQL_DSN')?:'';
    if(!preg_match('/dbname=[a-zA-Z0-9_]+_test(?:;|$)/',$dsn)) throw new RuntimeException('Use a dedicated disposable database ending in _test');
    $c['db']=['dsn'=>$dsn,'user'=>getenv('TEST_MYSQL_USER')?:'root','password'=>getenv('TEST_MYSQL_PASSWORD')?:''];
    $c['key']=base64_encode(str_repeat('x',32)); // Fixture-only encryption key, never deployment config.
    $c['forms_enabled']=$c['checkout_enabled']=$c['documents_approved']=true;
    $c['support']='support@example.invalid';$c['application_recipient']='forms@example.invalid';
    $c['yookassa']=['shop_id'=>'fixture-shop','secret'=>'fixture-only','test'=>true];
    $c['fiscal']=['approved'=>false,'integration'=>'payment_with_receipt','tax_system_code'=>1,'vat_code'=>1,'payment_subject'=>'service','payment_mode'=>'full_payment','refund_payment_mode'=>'full_payment'];
    return new App(new Db($c['db']),$c,new Crypto($c['key']),new FakeGateway());
}
function documents(array $ids): array {return array_map(fn($id)=>['id'=>$id,'version'=>'fixture-1'],$ids);}
function purchase(): array {return ['requestKey'=>bin2hex(random_bytes(32)),'name'=>'Test Buyer','email'=>'buyer@example.invalid','phone'=>'+70000000000','termsAccepted'=>'yes','consentDocuments'=>documents(['terms','offer','buyers','privacy'])];}
