#!/usr/bin/env bash
set -euo pipefail
umask 077
archive=$(realpath "${1:?Pass the path to test-purchase.tar.gz}")
cd "$HOME/domains/statusteam-official.ru"
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
work=$(mktemp -d "$private/.purchase.XXXXXX")
trap 'rm -rf "$work"' EXIT
tar -xzf "$archive" -C "$work"
test -s "$work/test-purchase.html"
test -d "$work/_next/static"
php -l "$work/router.php"
php -l "$work/page.php"

backup=$(mktemp -d "$private/backup-purchase.XXXXXX")
cp "$public/router.php" "$public/page.php" "$public/app.js" "$backup/"
if [ -f "$private/test-purchase.html" ]; then
    cp "$private/test-purchase.html" "$backup/"
fi
mkdir -p -m 755 "$public/purchase-assets/_next"
find "$work/_next" -type d -exec chmod 755 {} +
find "$work/_next" -type f -exec chmod 644 {} +
cp -R "$work/_next/." "$public/purchase-assets/_next/"
install -m 644 "$work/test-purchase.html" "$private/test-purchase.html"
for file in app.js page.php router.php; do
    chmod 644 "$work/$file"
    mv -f "$work/$file" "$public/$file"
done

echo 'Обычная форма покупки установлена в тестовом кабинете.'
echo "Резервная копия: $backup"
