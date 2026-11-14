#!/usr/bin/env bash
set -euo pipefail
archive=$(realpath "${1:?Укажите путь к checkout-layout.tar.gz}")
root="$HOME/domains/statusteam-official.ru"
test -f "$root/public_html/index.html"
stage=$(mktemp -d "$root/.checkout-layout.XXXXXX")
trap 'rm -rf "$stage"' EXIT
tar -xzf "$archive" -C "$stage"
test -s "$stage/index.html"
test -d "$stage/_next/static"
backup=$(mktemp -d "$root/backup-checkout-layout.XXXXXX")
for name in index.html index.txt; do
  if [ -f "$root/public_html/$name" ]; then cp -p "$root/public_html/$name" "$backup/"; fi
done
mkdir -p "$root/public_html/_next/static"
cp -R "$stage/_next/static/." "$root/public_html/_next/static/"
for name in index.txt index.html; do
  if [ -f "$stage/$name" ]; then
    chmod 644 "$stage/$name"
    mv -f "$stage/$name" "$root/public_html/$name"
  fi
done
echo "Главная страница обновлена. Резервная копия: $backup"
