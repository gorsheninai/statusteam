<?php
declare(strict_types=1);
namespace StatusTeam;
final class Validation {
    public static function text(array $d,string $key,int $max=200,bool $required=true): string {
        $v=$d[$key]??'';
        if(!is_string($v) || mb_strlen($v)>$max || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/',$v) || ($required && trim($v)==='')) throw new Problem(422,'invalid_'.$key);
        return trim($v);
    }
    public static function email(string $v): string { if(!filter_var($v,FILTER_VALIDATE_EMAIL) || strlen($v)>254) throw new Problem(422,'invalid_email'); return $v; }
    public static function phone(string $v): string { if(!preg_match('/^\+?[0-9 ()-]{7,32}$/D',$v) || strlen(preg_replace('/\D/','',$v))<7) throw new Problem(422,'invalid_phone');return $v; }
    public static function key(array $d): string { $k=self::text($d,'requestKey',64); if(!preg_match('/^[a-f0-9]{64}$/D',$k)) throw new Problem(422,'invalid_request_key'); return $k; }
    public static function contact(string $v): string {
        if(filter_var($v,FILTER_VALIDATE_EMAIL) || preg_match('/^@?[a-zA-Z0-9_]{5,32}$/D',$v) || preg_match('~^https://t\.me/[a-zA-Z0-9_]{5,32}$~D',$v)) return $v;
        return self::phone($v);
    }
    public static function application(array $d,bool $allowMinor): array {
        $kind=self::text($d,'form',20);
        $spec=match($kind) {
            'casting'=>['name'=>200,'age'=>3,'city'=>200,'height'=>3,'params'=>100,'contact'=>254,'links'=>1000],
            'partner'=>['company'=>200,'name'=>200,'contact'=>254,'format'=>200,'message'=>3000],
            'press'=>['name'=>200,'outlet'=>200,'link'=>1000,'reach'=>200,'contact'=>254],
            default=>throw new Problem(422,'unsupported_form'),
        };
        $optional=['params','links','format','message','reach']; $v=[];
        foreach($spec as $k=>$max) $v[$k]=self::text($d,$k,$max,!in_array($k,$optional,true));
        $v['contact']=self::contact($v['contact']);
        foreach(['links','link'] as $k) if(!empty($v[$k]) && (!filter_var($v[$k],FILTER_VALIDATE_URL) || !preg_match('~^https?://~',$v[$k]))) throw new Problem(422,'invalid_link');
        $minor=false;
        if($kind==='casting') {
            if(!ctype_digit($v['age']) || (int)$v['age']<1 || (int)$v['age']>100) throw new Problem(422,'invalid_age');
            if(!ctype_digit($v['height']) || (int)$v['height']<40 || (int)$v['height']>250) throw new Problem(422,'invalid_height');
            $minor=(int)$v['age']<18;
            if(($d['consentSubject']??'')!==($minor?'guardian':'candidate')) throw new Problem(422,'invalid_consent_subject');
            if($minor) {
                if(!$allowMinor) throw new Problem(503,'guardian_documents_pending');
                foreach(['guardianName'=>200,'guardianRole'=>80,'guardianPhone'=>32,'guardianEmail'=>254] as $k=>$max) $v[$k]=self::text($d,$k,$max);
                if(!in_array($v['guardianRole'],['parent','adoptive_parent','guardian','custodian'],true)) throw new Problem(422,'invalid_guardian_role');
                self::phone($v['guardianPhone']);self::email($v['guardianEmail']);
                if(($d['guardianAuthority']??'')!=='yes') throw new Problem(422,'guardian_authority_required');
            }
        }
        if(($d['termsAccepted']??'')!=='yes' || ($d['consent']??'')!=='yes') throw new Problem(422,'consent_required');
        return [$kind,$v,['terms','privacy',$kind==='casting'?($minor?'guardian':'casting'):$kind]];
    }
    public static function amount(array $a): int {
        if(($a['currency']??'')!=='RUB' || !is_string($a['value']??null) || !preg_match('/^(0|[1-9][0-9]{0,7})\.[0-9]{2}$/D',$a['value'])) throw new Problem(409,'provider_amount_invalid');
        [$r,$k]=explode('.',$a['value']);return (int)$r*100+(int)$k;
    }
}
