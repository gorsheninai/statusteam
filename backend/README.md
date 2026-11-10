# STATUS TEAM PHP backend

Установка, пути API, Cron, webhook, касса, доступы и ограничения:
[пошаговая инструкция](../docs/backend-sprinthost.md).

Только `public/` разрешено копировать в web root. `config.php`, исходники, vendor,
миграции и журналы остаются снаружи. Конфигурация по умолчанию блокирует приём данных
и checkout. Продажи на существующем сайте не включены.

Проверки, использующие настоящую одноразовую MySQL-базу (удаляют её таблицы):

```bash
composer install
TEST_ALLOW_RESET=yes \
TEST_MYSQL_DSN='mysql:host=127.0.0.1;dbname=statusteam_test;charset=utf8mb4' \
TEST_MYSQL_USER=YOUR_TEST_USER TEST_MYSQL_PASSWORD=YOUR_TEST_PASSWORD \
php tests/run.php
```

Провайдер платежей и транспорт SMTP в этом наборе заменены управляемыми fixtures.
Транзакции, уникальные ограничения, fault injection и конкуренция — настоящий MySQL.
Не использовать реальные контакты, ключи или production-базу в тестах.
HTTP/mobile smoke harness: `tests/http-fixture.php`, `tests/http.mjs`; сначала
синтетическая БД `tests/run.php`, затем fixture-конфиг вне web root, копия public в
локальном `/api`, PHP server на localhost:34311. Нужны env HTTP_FIXTURE_CONFIG,
HTTP_FIXTURE_JSON, STATUS_CONFIG и установленный Chromium (`npx playwright install chromium`).
