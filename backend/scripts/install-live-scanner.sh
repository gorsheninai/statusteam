#!/usr/bin/env bash
# Restore the local QR reader used by the authenticated staff console.
# Never modify payments, tickets, database, or configuration.
set -euo pipefail
umask 077

archive=$(realpath "${1:?Pass the verified control-purchase archive}")
cd "$HOME/domains/statusteam-official.ru"
target="public_html/api"
test -s "$target/index.php" && test -s "$target/page.php" && test -s "$target/app.js"
grep -Fq 'scanner.min.js' "$target/page.php"
grep -Fq 'ZXingBrowser.BrowserQRCodeReader' "$target/app.js"

work=$(mktemp -d "$HOME/domains/statusteam-official.ru/status-backend/.scanner.XXXXXX")
trap 'rm -rf "$work"' EXIT
tar -xzf "$archive" -C "$work" ./public/scanner.min.js ./public/scanner-LICENSE ./scanner.sha256
(cd "$work" && sha256sum -c scanner.sha256)
test -s "$work/public/scanner.min.js"
grep -Fq 'ZXingBrowser' "$work/public/scanner.min.js"

backup=$(mktemp -d "status-backend/backup-scanner.XXXXXX")
if [ -f "$target/scanner.min.js" ]; then
    cp -p "$target/scanner.min.js" "$backup/scanner.min.js"
fi
if [ -f "$target/scanner-LICENSE" ]; then
    cp -p "$target/scanner-LICENSE" "$backup/scanner-LICENSE"
fi
install -m 644 "$work/public/scanner.min.js" "$target/.scanner.new"
install -m 644 "$work/public/scanner-LICENSE" "$target/.scanner-LICENSE.new"
mv -f "$target/.scanner-LICENSE.new" "$target/scanner-LICENSE"
mv -f "$target/.scanner.new" "$target/scanner.min.js"

test -r "$target/scanner.min.js" && test -s "$target/scanner.min.js"
echo 'ГОТОВО: локальный QR-сканер восстановлен в рабочем кабинете.'
echo 'Оплата, чеки, билеты, база данных и публичные продажи не изменялись.'
echo "Резервная копия (если файл уже был): $backup"
echo 'Откройте: https://statusteam-official.ru/api/index.php?r=staff'
