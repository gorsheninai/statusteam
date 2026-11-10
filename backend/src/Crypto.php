<?php
declare(strict_types=1);
namespace StatusTeam;
final class Crypto {
    private string $key;
    public function __construct(string $key) {
        $k=base64_decode($key,true);
        if($k===false || strlen($k)!==32) throw new \RuntimeException('Invalid private encryption key');
        $this->key=$k;
    }
    public static function id(): string {return bin2hex(random_bytes(16));}
    public static function hash(string $s): string {return hash('sha256',$s);}
    public function seal(string $s): string {
        $n=random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return base64_encode($n.sodium_crypto_secretbox($s,$n,$this->key));
    }
    public function open(string $s): string {
        $b=base64_decode($s,true);
        if(!$b) throw new \RuntimeException('Invalid ciphertext');
        $v=sodium_crypto_secretbox_open(substr($b,24),substr($b,0,24),$this->key);
        if($v===false) throw new \RuntimeException('Invalid ciphertext');
        return $v;
    }
    // Deterministic unguessable capability from a random client retry key. No plaintext token in DB.
    public function capability(string $requestKey): string {return hash_hmac('sha256','order:'.$requestKey,$this->key);}
}
