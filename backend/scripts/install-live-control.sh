#!/usr/bin/env bash
set -euo pipefail
umask 077
archive=$(realpath "${1:?Pass the verified control checkout archive}")
cd "$HOME/domains/statusteam-official.ru"
private=status-backend
public=public_html/api
php_bin=$(php -r 'echo PHP_BINARY;')
work=$(mktemp -d "$private/.control.XXXXXX")
trap 'rm -rf "$work"' EXIT
tar -xzf "$archive" -C "$work"
site=public_html
test -s "$work/index.html"
test -s "$site/index.html"
test -d "$work/_next/static"

env -u STATUS_CONFIG "$php_bin" /dev/stdin "$work" <<'PHP'
<?php
$work=$argv[1];
$get=static fn() => require 'status-backend/bootstrap.php';
$app=$get();
$c=$app->c;
if (($c['environment']??null)!=='live' || ($c['yookassa']['test']??true)!==false
    || (string)($c['yookassa']['shop_id']??'')!=='1513337'
    || !str_starts_with($c['yookassa']['secret']??'','live_')
    || ($c['base_url']??'')!=='https://statusteam-official.ru/api'
    || !empty($c['checkout_enabled'])) {
    fwrite(STDERR,"СТОП: не совпал рабочий магазин, режим, адрес API или состояние публичной оплаты.\n");
    exit(1);
}
$docs=$app->db->one("SELECT COUNT(DISTINCT id) AS n FROM documents WHERE active=1 AND id IN ('terms','buyers','privacy')");
$admin=$app->db->one("SELECT COUNT(*) AS n FROM staff WHERE active=1 AND role='admin'");
if ((int)$docs['n']!==3 || (int)$admin['n']===0) {
    fwrite(STDERR,"СТОП: проверьте документы и администратора в рабочей базе.\n");
    exit(1);
}
$current=file_get_contents('status-backend/src/Mailer.php');
$staged=file_get_contents("$work/src/Mailer.php");
$pattern='/(public function send\([^\n]*\): void \{\R)(.*?)(^[ \t]*\$m->MessageID[ \t]*=)/ms';
if (str_contains($current,'$m->MessageID') && preg_match($pattern,$current,$old) && preg_match($pattern,$staged)) {
    $staged=preg_replace_callback($pattern,fn($m)=>$m[1].$old[2].$m[3],$staged,1);
} else {
    fwrite(STDERR,"СТОП: не распознана настройка отправки писем в рабочем Mailer.php.\n");
    exit(1);
}
if (file_put_contents("$work/src/Mailer.php",$staged)!==strlen($staged)) exit(1);
$c['support']=($c['support']??'')?:'tickets@statusteam-official.ru';
$c['documents_approved']=true;
$c['live_approved']=true;
$c['control_checkout_enabled']=true;
$c['fiscal']=array_replace($c['fiscal']??[],[
    'approved'=>true,'integration'=>'yoo_receipt','vat_code'=>1,'payment_subject'=>'service',
    'payment_mode'=>'full_payment','refund_payment_mode'=>'full_payment',
]);
$content="<?php\nreturn ".var_export($c,true).";\n";
if (file_put_contents("$work/config.php",$content)!==strlen($content)) exit(1);
PHP

for file in "$work"/src/*.php "$work"/public/*.php "$work/config.php"; do
  "$php_bin" -l "$file"
done
"$php_bin" -r '
    require "status-backend/vendor/autoload.php";
    require $argv[1]."/src/App.php";
    require $argv[1]."/src/TicketDetails.php";
    require $argv[1]."/src/TicketPdf.php";
    $pdf=\StatusTeam\TicketPdf::render("ST-0123456789ABCDEF",str_repeat("a",64),false,100,str_repeat("b",32));
    if (!str_starts_with($pdf,"%PDF-")) exit(1);
' "$work"

backup=$(mktemp -d "$private/backup-control.XXXXXX")
mkdir "$backup/src" "$backup/public"
cp -p "$private/config.php" "$backup/"
mkdir "$backup/homepage"
cp -p "$site/index.html" "$backup/homepage/"
if [ -f "$site/index.txt" ]; then cp -p "$site/index.txt" "$backup/homepage/"; fi
for f in "$work"/src/*; do
    name=$(basename "$f")
    if [ -f "$private/src/$name" ]; then cp -p "$private/src/$name" "$backup/src/"; fi
done
for f in "$work"/public/*; do
    name=$(basename "$f")
    if [ -f "$public/$name" ]; then cp -p "$public/$name" "$backup/public/"; fi
done
for f in "$work"/src/* "$work"/public/*; do chmod 644 "$f"; done
mkdir -p -m 755 "$site/_next/static"
find "$work/_next/static" -type d -exec chmod 755 {} +
find "$work/_next/static" -type f -exec chmod 644 {} +
cp -R "$work/_next/static/." "$site/_next/static/"
mv -f "$work"/src/* "$private/src/"
mv -f "$work"/public/{app.css,app.js,page.php,index.php} "$public/"
mv -f "$work/config.php" "$private/config.php"
for name in index.txt index.html; do
    if [ -f "$work/$name" ]; then
        chmod 644 "$work/$name"
        mv -f "$work/$name" "$site/$name"
    fi
done

echo "Закрытая покупка на 1 ₽ готова. Резервная копия: $backup"
echo "Кабинет: https://statusteam-official.ru/api/index.php?r=staff"
