#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$HOME/domains/statusteam-official.ru"
source_commit=aaf87ef1c74cb54c9c9fa63c8122fd3a373ea8ea
repo="https://raw.githubusercontent.com/gorsheninai/statusteam/$source_commit"
private=status-backend-test
public=public_html/api-test

env -u STATUS_CONFIG php -r '
    $config = require "status-backend-test/config.php";
    if (($config["environment"] ?? "") !== "test"
        || ($config["yookassa"]["test"] ?? false) !== true
        || (string) ($config["yookassa"]["shop_id"] ?? "") !== "1530577"
        || !preg_match("/(?:^|;)dbname=a1325854_test(?:;|$)/", $config["db"]["dsn"] ?? "")) {
        fwrite(STDERR, "СТОП: ожидался тестовый магазин 1530577.\n");
        exit(1);
    }
'
test -f "$public/router.php"
work=$(mktemp -d "$private/.update-ticket.XXXXXX")
trap 'rm -rf "$work"' EXIT

for file in TicketDetails.php TicketPdf.php TicketFont.json TicketFont-LICENSE.txt; do
  curl -fsSL --max-time 30 "$repo/backend/src/$file" -o "$work/$file"
done
curl -fsSL --max-time 30 "$repo/backend/src/Mailer.php" -o "$work/Mailer.php"
curl -fsSL --max-time 30 "$repo/backend/public/index.php" -o "$work/router.php"
for file in app.js app.css page.php; do
  curl -fsSL --max-time 30 "$repo/backend/public/$file" -o "$work/$file"
done

# Keep the transport and sender settings that delivered mail on this host.
php /dev/stdin "$work/Mailer.php" "$private/src/Mailer.php" <<'PHP'
<?php
$staged = file_get_contents($argv[1]);
$current = file_get_contents($argv[2]);
$transport = '/(public function send\([^\n]*\): void \{\R)(.*?)(^[ \t]*\$m->MessageID[ \t]*=)/ms';
if (!preg_match($transport, $current, $old) || !preg_match($transport, $staged)) {
    fwrite(STDERR, "СТОП: не удалось распознать текущий почтовый транспорт.\n");
    exit(1);
}
$next = preg_replace_callback($transport, fn($match) => $match[1].$old[2].$match[3], $staged, 1);
if (file_put_contents($argv[1], $next) !== strlen($next)) {
    exit(1);
}
PHP

for file in TicketDetails TicketPdf Mailer router page; do
  php -l "$work/$file.php"
done

php -r '
    require "status-backend-test/vendor/autoload.php";
    require dirname($argv[1])."/TicketDetails.php";
    require $argv[1];
    $pdf = \StatusTeam\TicketPdf::render("ST-0123456789ABCDEF", str_repeat("a", 64), true, 3000000, str_repeat("b", 32));
    if (!str_starts_with($pdf, "%PDF-1.4")) exit(1);
' "$work/TicketPdf.php"

backup=$(mktemp -d "$private/backup-ticket.XXXXXX")
cp "$private/src/Mailer.php" "$public/router.php" "$public/app.js" "$public/app.css" "$public/page.php" "$backup/"
for file in TicketDetails.php TicketPdf.php TicketFont.json TicketFont-LICENSE.txt; do
  if [ -f "$private/src/$file" ]; then
    cp "$private/src/$file" "$backup/"
  fi
done

for file in TicketFont.json TicketFont-LICENSE.txt TicketDetails.php TicketPdf.php Mailer.php; do
  chmod 644 "$work/$file"
  mv -f "$work/$file" "$private/src/$file"
done
for file in app.js app.css page.php router.php; do
  chmod 644 "$work/$file"
  mv -f "$work/$file" "$public/$file"
done

echo 'Русскоязычные PDF и веб-билет установлены в тестовом кабинете.'
echo "Резервная копия: $backup"

