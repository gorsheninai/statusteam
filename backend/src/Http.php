<?php
declare(strict_types=1);
namespace StatusTeam;
final class Http {
    public static function ip(array $c): string {
        $remote=$_SERVER['REMOTE_ADDR']??'';
        // Only explicitly configured exact proxy addresses may supply X-Forwarded-For.
        if(in_array($remote,$c['trusted_proxies'],true)) {
            $chain=explode(',',$_SERVER['HTTP_X_FORWARDED_FOR']??'');
            foreach(array_reverse($chain) as $candidate) {
                $candidate=trim($candidate);
                if(!filter_var($candidate,FILTER_VALIDATE_IP)) throw new Problem(400,'invalid_proxy_header');
                if(!in_array($candidate,$c['trusted_proxies'],true)) return $candidate;
            }
        }
        return filter_var($remote,FILTER_VALIDATE_IP)?$remote:'0.0.0.0';
    }
    public static function input(): array {
        if((int)($_SERVER['CONTENT_LENGTH']??0)>32768) throw new Problem(413,'request_too_large');
        if(!str_starts_with($_SERVER['CONTENT_TYPE']??'','application/json')) throw new Problem(415,'json_required');
        $raw=file_get_contents('php://input',false,null,0,32769);
        if(strlen($raw)>32768) throw new Problem(413,'request_too_large');
        try {$d=json_decode($raw,true,32,JSON_THROW_ON_ERROR);} catch(\Throwable) {throw new Problem(400,'invalid_json');}
        if(!is_array($d) || !str_starts_with(ltrim($raw),'{')) throw new Problem(400,'invalid_json');return $d;
    }
    public static function session(): void {
        ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');
        session_name('status_staff');session_set_cookie_params(['lifetime'=>0,'path'=>'/api/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);session_start();
        $_SESSION['csrf']??=bin2hex(random_bytes(32));
    }
    public static function csrf(array $d): void {if(!is_string($d['csrf']??null) || !hash_equals($_SESSION['csrf']??'', $d['csrf'])) throw new Problem(403,'csrf_required');}
    public static function staff(App $app,bool $admin=false): array {
        if(($_SESSION['last']??0)<time()-1800 || ($_SESSION['started']??0)<time()-14400) {unset($_SESSION['staff']);throw new Problem(401,'login_required');}
        $s=$app->db->one('SELECT id,username,role FROM staff WHERE id=? AND active=1',[$_SESSION['staff']??0]);
        if(!$s) throw new Problem(401,'login_required');
        if($admin && $s['role']!=='admin') throw new Problem(403,'admin_required');
        $_SESSION['last']=time();return $s;
    }
    public static function output(array $data,int $status=200): never {http_response_code($status);header('Content-Type: application/json; charset=utf-8');echo App::json($data);exit;}
}
