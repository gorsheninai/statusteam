# STATUS TEAM — Пульс континента

Одностраничный сайт fashion-шоу. Next.js 15, React 19, TypeScript, CSS, GSAP и Lenis.
Сайт собирается в статические файлы `out/`.

## Запуск

Нужен Node.js 20 или новее.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Для проверки готовой версии:

```bash
npm run build
npm run verify:media
npm start
```

Откройте `http://localhost:4311`. После повторной сборки перезапустите сервер.
`npm run dev` использует обычный адрес Next.js `http://localhost:3000`.

## Где редактировать сайт

| Задача | Файл или папка |
|---|---|
| Порядок блоков страницы | `src/app/page.tsx` |
| Первый экран | `src/sections/hero/` |
| STATUS TEAM, видео и фотокарусели | `src/sections/status-team/` |
| Четыре образа нового шоу | `src/sections/pulse/` |
| Программа | `src/sections/experience/` |
| Предзаказ билетов | `src/sections/tickets/` |
| Участие и партнёрство | `src/sections/join/` |
| Частые вопросы | `src/sections/faq/` |
| Шапка, подвал и заставка | `src/components/layout/` |
| Поля форм и отправка | `src/features/forms/` |
| Анимации и прокрутка | `src/motion/` |
| Тексты, настройки и списки фотографий | `src/content/` |
| Общие стили и порядок подключения | `src/styles/index.css` |
| Исходные фото и видео | `assets/originals/` |
| Подготовленные файлы для браузера | `public/media/` |

## Замена контента

- Город, статус продаж, ссылка на билеты, контакты и видимость блоков: `src/content/event.ts`.
- Фотографии первого экрана: `src/content/hero.ts`.
- Порядок архивных фотографий и статистика: `src/content/archive.ts`.
- Четыре образа: `src/content/pulse.ts`.
- Программа, FAQ и участие: `src/content/program.ts`, `faq.ts`, `participation.ts`.
- Поля и сообщения форм: `src/features/forms/fields.ts`.
- Соответствие имени медиафайла его URL: `src/content/media-files.json`.

Подробная инструкция: [медиа и привязки](docs/media.md).

## Проверки

```bash
npm run typecheck
npm run lint
npm run build
npm run verify:media
# В другом терминале: npm start
npm run verify
```

Браузерные проверки используют Chromium: перед первым запуском выполните `npx playwright install chromium`.
Проверки и ограничения текущего набора описаны в [docs/validation.md](docs/validation.md).

## Размещение

[Инструкция по размещению](docs/deployment.md) описывает Cloudflare и перенос статической сборки на Beget.
Не загружайте на хостинг весь репозиторий: публикуется содержимое `out/`.

Формы требуют отдельного обработчика, адрес которого задаётся через `NEXT_PUBLIC_FORM_ENDPOINT`
до сборки. Продажа билетов включается настройками в `src/content/event.ts`.
Серверные ключи и реальные заявки в репозитории не хранятся.

## Документация

- [Структура проекта](docs/structure.md)
- [Работа с медиа](docs/media.md)
- [Каталог и происхождение фотографий](docs/media-index.md)
- [Стили и их порядок](docs/styles.md)
- [Карта перемещений файлов](docs/file-moves.json)
- [Проверки](docs/validation.md)
- [Правила для работы с кодом](CLAUDE.md)
