# Результаты проверки — 11 ноября 2026

Проверки выполнены локально, без боевых ключей, реальных списаний, возвратов и
контактов. MySQL Community Server 8.4.7, PHP 8.4.24, Node.js 24.22.1,
Chromium 141 / Playwright 1.56.1. Тестовая БД отдельная, одноразовая.

| Проверка | Фактический результат |
|---|---|
| `backend/tests/run.php` | 51/51 passed, реальный MySQL и несколько параллельных PHP-процессов |
| `backend/tests/http.mjs` | 14/14 passed, настоящий PHP HTTP server и Chromium, экран 390×844 |
| consents, ticket-order, cookie-choice | 11/11 passed |
| PHP syntax, Composer validate/check-platform-reqs | passed |
| Composer audit | известных уязвимостей не найдено на момент проверки |
| npm typecheck, lint, build | passed, статический экспорт собран |
| verify:media | passed: 180 файлов каталога, 186 ссылок экспорта |
| Главный UI-набор `tests/verify.mjs` | 196 pass / 44 fail |
| Тот же UI-набор на исходном commit `1ae95c263286d3a370b6a731db86e88386bc3274` | те же 196 pass / 44 fail; списки ошибок совпали дословно, новых ошибок нет |

## Что проверялось сервером

Обязательные согласия и редакции; CLI-миграции и повторный запуск; повтор клика;
неизменяемость тела повторного запроса; API pending/успех/отмена; поддельное
уведомление; неправильная сумма/магазин/test-mode; повторный и запоздалый webhook;
поздний успех через 30 минут при сохранённом резерве; восстановление таймаута
с тем же ключом; блокировка повтора старше 23 часов; DB fault injection между
оплатой и outbox с полным rollback; SMTP-сбой и повтор; повторная отправка того же
билета; 8 покупателей последнего места; 6 одновременных проходов; повторный проход;
полный, частичный, неопределённый, отменённый и внешний возвраты; блокировка прохода
при несверенном refunded_amount; заявки и представители; блокировка рассылки;
доверие IP; локальная генерация QR; запрет неподготовленного live-checkout.

**Платёжный API и SMTP-транспорт здесь управляемые fixtures.** Транзакции, индексы,
FK, блокировки, очереди и конкурентный доступ — настоящий MySQL, не моки.
Fault injection — отклонение INSERT очереди триггером БД, а не физическое убийство
процесса. Проверено, что новая оплата, билет и outbox откатываются совместно.

HTTP-проверки: печатный билет, QR, мобильная ширина, запреты Origin/GET/CSRF,
отключённый checkout, login/logout, права контролёра, ручной номер ST-..., отдельный
POST прохода, повторный проход, наличие локального сканера и таблицы администратора.

## Что не подтверждено внешней средой

Установка на Sprinthost, выбранные там PHP/MySQL, SMTP и фактическая доставка,
SPF/DKIM/DMARC, реальные тестовые платежи/возвраты ЮKassa и фискальные чеки,
реальный webhook через хостинг, права .htaccess, работа камеры на физических
iPhone/Android, backup/уничтожение у провайдера. Автоматический purge данных не
выполнялся; он заблокирован до конца мероприятия и утверждённых дат хранения.
Закрывающие чеки предоплаты и рекламная рассылка не реализованы; соответствующие
сценарии остаются отключёнными.

## Общий UI-набор: прежние ошибки

Сначала набор остановился из-за существующего cookie-баннера, перекрывавшего
пункт меню. В harness добавлен реальный выбор «Только необходимые» перед работой
со страницей. Затем одинаковый harness выполнен на новой ветке и в отдельном
worktree исходного commit. Обе сборки дали **одинаковые 44 ошибки**. Изменения
бекенда не исправляют и не маскируют их. Это не полностью зелёный общий UI-набор;
следующие команды npm run verify после первого сбоя через && не запускались.
Дизайн существующего сайта по заданию сохранён.

Полный совпавший список:

```text
[1440] the participation pass keeps an opaque ground under its label — alpha 0.5
  [1440] join heading breaks into exactly two uppercase lines — 1 line(s)
  [1440] join heading's two lines render close to the same width — 44.703125px apart
  [1440] broken divider before join is removed
  [1280] the participation pass keeps an opaque ground under its label — alpha 0.5
  [1280] no mask-clipped text — Я бренд / партнёр 403>365
  [1280] join heading breaks into exactly two uppercase lines — 1 line(s)
  [1280] join heading's two lines render close to the same width — 39.84375px apart
  [1280] broken divider before join is removed
  [1024] the participation pass keeps an opaque ground under its label — alpha 0.5
  [1024] no mask-clipped text — Я бренд / партнёр 403>292
  [1024] join heading breaks into exactly two uppercase lines — 1 line(s)
  [1024] join heading's two lines render close to the same width — 32.078125px apart
  [1024] broken divider before join is removed
  [768] the pass keeps paper labels and sand rules
  [768] the hero button label never reaches its own arrow
  [768] hero button labels stay at 13px or above — 12px
  [768] city and month stay anchored to the bottom of the first screen
  [768] broken divider before join is removed
  [430] the pass keeps paper labels and sand rules
  [430] hero button labels stay at 13px or above — 12px
  [430] city and month stay anchored to the bottom of the first screen
  [430] join section opens on the beat step — 32px
  [430] broken divider before join is removed
  [390] the pass keeps paper labels and sand rules
  [390] hero button labels stay at 13px or above — 12px
  [390] city and month stay anchored to the bottom of the first screen
  [390] join section opens on the beat step — 29.25px
  [390] broken divider before join is removed
  [360] the pass keeps paper labels and sand rules
  [360] hero button labels stay at 13px or above — 12px
  [360] city and month stay anchored to the bottom of the first screen
  [360] join section opens on the beat step — 27px
  [360] broken divider before join is removed
  [320] the hero button label never reaches its own arrow
  [320] hero button labels stay at 13px or above — 12px
  [320] city and month stay anchored to the bottom of the first screen
  [320] join section opens on the beat step — 24px
  [320] broken divider before join is removed
  [desktop] ticket button visible over the hero
  [phone] ticket button visible over the hero
  the reel offers the requested watch control
  [desktop] the tenets chapter pins
  contrast: text on solid grounds meets WCAG AA — "Билеты" 1.00 | "↗" 4.28 | "© 2026 STATUS TEAM. Вс" 3.54
```
