#!/usr/bin/env bash
# Applies only the admin Smart Payment patch on an already configured live site.
set -euo pipefail
umask 077

archive=$(realpath "${1:?Pass the verified control-purchase.tar.gz archive}")
cd "$HOME/domains/statusteam-official.ru"

private="status-backend"
site="public_html"
target="$private/src/App.php"
test -s "$target" && test -s "$site/index.html"
php -r '
$app=require "status-backend/bootstrap.php";
if (!$app->controlEnabled() || !empty($app->c["checkout_enabled"])
 || ($app->c["base_url"]??"")!=="https://statusteam-official.ru/api") {
    fwrite(STDERR,"СТОП: закрытая контрольная оплата не настроена, либо публичные продажи включены.\n");
    exit(1);
}
'

staging=$(mktemp -d "$private/.smart.XXXXXX")
trap 'rm -rf "$staging"' EXIT
tar -xzf "$archive" -C "$staging"
test -s "$staging/src/App.php"
test -s "$staging/index.html"
test -d "$staging/_next/static"
grep -Fq "'checkout'=>'smart-v1'" "$staging/src/App.php"
grep -RFq 'Способ оплаты выберете на защищённой странице ЮKassa' "$staging/_next/static"
php -l "$staging/src/App.php"

backup=$(mktemp -d "$private/backup-smart.XXXXXX")
cp -p "$target" "$backup/App.php"
cp -p "$site/index.html" "$backup/index.html"
if [ -f "$site/index.txt" ]; then cp -p "$site/index.txt" "$backup/index.txt"; fi

# Install the versioned assets first; only swap the page and PHP after that.
mkdir -p "$site/_next/static"
find "$staging/_next/static" -type d -exec chmod 755 {} +
find "$staging/_next/static" -type f -exec chmod 644 {} +
cp -R "$staging/_next/static/." "$site/_next/static/"
install -m 644 "$staging/src/App.php" "$private/.App.smart.new"
install -m 644 "$staging/index.html" "$site/.index.smart.new"
if [ -f "$staging/index.txt" ]; then install -m 644 "$staging/index.txt" "$site/.index.smart.txt.new"; fi

mv -f "$private/.App.smart.new" "$target"
if [ -f "$site/.index.smart.txt.new" ]; then mv -f "$site/.index.smart.txt.new" "$site/index.txt"; fi
mv -f "$site/.index.smart.new" "$site/index.html"

php -l "$target"
echo "ГОТОВО: Умный платеж ЮKassa включен только для администратора (1 ₽)."
echo "Публичные продажи остаются закрытыми."
echo "Резервная копия: $backup"
