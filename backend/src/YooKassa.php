<?php
declare(strict_types=1);
namespace StatusTeam;
final class YooKassa implements Gateway {
    public function __construct(private array $config) {}
    public function call(string $method,string $path,?array $body=null,?string $key=null): array {
        if(!preg_match('~^/(?:payments(?:/[a-zA-Z0-9-]+(?:/(?:capture|cancel))?)?|refunds(?:/[a-zA-Z0-9-]+)?)$~D',$path)) throw new \RuntimeException('Invalid provider path');
        $ch=curl_init('https://api.yookassa.ru/v3'.$path);
        $headers=['Content-Type: application/json']; if($key) $headers[]='Idempotence-Key: '.$key;
        curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_USERPWD=>$this->config['shop_id'].':'.$this->config['secret'],CURLOPT_HTTPHEADER=>$headers,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>8,CURLOPT_TIMEOUT=>25,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
        if($body!==null) curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($body,JSON_THROW_ON_ERROR));
        elseif($method==='POST' && str_ends_with($path,'/cancel')) curl_setopt($ch,CURLOPT_POSTFIELDS,'{}');
        $raw=curl_exec($ch); $status=curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch);
        // No response bodies, URLs, customer data or credentials in errors/logs.
        if($raw===false || $status<200 || $status>=300) throw new Problem(503,'provider_unavailable');
        $v=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
        if(!is_array($v)) throw new Problem(503,'provider_invalid_response');
        return $v;
    }
}
