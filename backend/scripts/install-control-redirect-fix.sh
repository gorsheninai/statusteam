#!/usr/bin/env bash
set -euo pipefail
umask 077

cd "$HOME/domains/statusteam-official.ru"
private=status-backend
target="$private/src/App.php"
site=public_html/index.html

test -s "$target" && test -s "$site"
command -v curl >/dev/null
command -v php >/dev/null
command -v git >/dev/null

current=$(git hash-object "$target")
case "$current" in
  4bbde091e66a67a29ff626e85f3a092b0003d5f5|771ea90c8bafa4c32ac0a970d387596b28e3d0e4|0025765a87466d8839c65f8d241df65ef2c8daea) ;;
  *) echo 'СТОП: неизвестная версия App.php. Файлы не изменены.' >&2; exit 1 ;;
esac

# The preexisting administrator-only route must be installed and public checkout shut off.
php -r '
$app=require "status-backend/bootstrap.php";
if (!$app->controlEnabled() || !empty($app->c["checkout_enabled"])) {
  fwrite(STDERR,"СТОП: ожидаемый закрытый режим покупки не подтверждён.\n"); exit(1);
}
'

work=$(mktemp -d "$private/.redirect.XXXXXX")
trap 'rm -rf "$work"' EXIT

curl -fsSL --retry 2 --max-time 60 \
  'https://raw.githubusercontent.com/gorsheninai/statusteam/8418ec87931bdca1143bdca410fca91ef35d034f/backend/src/App.php' \
  -o "$work/App.php"
if [ "$(git hash-object "$work/App.php")" != '0025765a87466d8839c65f8d241df65ef2c8daea' ]; then
  echo 'СТОП: контрольная сумма обработчика не совпадает.' >&2
  exit 1
fi
php -l "$work/App.php"

# The installed static homepage still remembers a completed attempt's request key.
# Reset it when the operator opens ?control=1. The server itself safely resumes
# the matching pending payment; this never activates public checkout.
php -r '
$raw=file_get_contents($argv[1]);
$marker="status-control-fresh-attempt";
if (!str_contains($raw,$marker)) {
  if (substr_count($raw,"</head>")!==1) {fwrite(STDERR,"СТОП: неожиданный HTML главной.\n");exit(1);}
  $script="<script id=\"$marker\">if(new URLSearchParams(location.search).get(\"control\")===\"1\"){try{sessionStorage.removeItem(\"status-request-control-purchase\")}catch(e){}}</script>";
  $raw=str_replace("</head>",$script."</head>",$raw);
}
if (file_put_contents($argv[2],$raw)===false) exit(1);
' "$site" "$work/index.html"

test -s "$work/index.html"
grep -q 'status-control-fresh-attempt' "$work/index.html"

backup=$(mktemp -d "$private/backup-control-redirect.XXXXXX")
cp -p "$target" "$backup/App.php"
cp -p "$site" "$backup/index.html"

install -m 644 "$work/App.php" "$work/App.new"
install -m 644 "$work/index.html" "$work/index.new"
mv -f "$work/App.new" "$target"
mv -f "$work/index.new" "$site"

php -l "$target"
echo 'ГОТОВО: кнопка «Оплатить» может открыть существующий или новый платёж ЮKassa.'
echo 'Публичные продажи остаются закрыты. Списание не проводилось.'
echo "Резервные копии: $backup"
