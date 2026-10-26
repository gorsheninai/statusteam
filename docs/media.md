# Медиа: хранение и привязки

## Папки

| Материалы | Исходники | Веб-файлы |
|---|---|---|
| Логотип | `assets/originals/brand/` | `public/media/brand/` |
| Первый экран нового шоу | `assets/originals/pulse-continent/hero/` | `public/media/pulse-continent/hero/` |
| Кампания | `assets/originals/pulse-continent/campaign/` | `public/media/pulse-continent/campaign/` и `posters/` |
| Четыре образа | `assets/originals/pulse-continent/elements/` | `public/media/pulse-continent/elements/` |
| «Славянский взгляд» | `assets/originals/slavyanskiy-vzglyad/` | `public/media/archive/slavyanskiy-vzglyad/` |
| Первый показ «Ход королевы» | `assets/originals/first-show/photos/` | `public/media/archive/first-show/` |

Исходные имена файлов сохранены. Разные размеры одной фотографии лежат рядом.
Веб-версии — WebP и сжатые MP4. JPG/PNG, которые раньше лежали в `public/media/`,
перенесены в исходники: текущая страница обращается к соответствующим WebP.
Варианты видео сохранены; активный ролик выбирается в `src/content/media.ts`.

## Как заменить фотографию

1. Найдите её имя и назначение в `src/content/` и `docs/media-index.md`.
2. Сохраните новый исходник в соответствующей папке `assets/originals/`.
3. Подготовьте WebP в тех же размерах, с нужным кадрированием и пропорциями.
   Не обрезайте подпись фотографа. При замене всех файлов под прежними именами
   менять привязку в коде не нужно.
4. Если добавляется новое имя или папка, внесите запись в `src/content/media-files.json`:

```json
"hero-wide-1800.webp": "/media/pulse-continent/hero/hero-wide-1800.webp"
```

5. Укажите имя в соответствующем контентном файле. Карусели используют имя серии
   без ширины и расширения, например `status-11`, и массив доступных ширин.
6. Обновите описание и `alt`, затем выполните `npm run build` и `npm run verify:media`.
7. Проверьте результат на телефоне и компьютере. Перезапустите сервер готовой сборки.

## Как разрешаются пути

`mediaFile("hero-wide-1800.webp")` возвращает полный URL из каталога.
`mediaSrcSet("hero-wide", [1200, 1800, 2560])` строит список URL для адаптивной загрузки.
Не собирайте путь как `/media/${name}` внутри компонентов: папку определяет каталог.
Неизвестное имя вызывает явную ошибку, чтобы опечатка не превращалась в незаметный битый кадр.

| Привязка | Источник |
|---|---|
| Desktop/mobile первого экрана | `src/content/hero.ts` |
| Четыре образа | `src/content/pulse.ts` |
| Две архивные карусели и порядок | `src/content/archive.ts` |
| Иллюстрации участия | `src/content/participation.ts` |
| Логотип, активное видео, превью соцсетей | `src/content/media.ts` |

При переносе сохранены все медиафайлы и их содержимое. Карта старых и новых путей —
`docs/file-moves.json`. Перемещение не уменьшает старую историю Git и не делает её перезапись необходимой.
