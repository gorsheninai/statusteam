import Nav from "@/components/Nav";
import ShowReel from "@/components/ShowReel";
import Participants from "@/components/Participants";
import ApplyForm from "@/components/ApplyForm";
import Motion from "@/components/Motion";

const Arrow = () => (
  <span className="arrow" aria-hidden="true">
    ↗
  </span>
);

/**
 * The hero art.
 *
 * Two finished frames, each composed for its own orientation — the landscape
 * one carries the models on the right against open dark space, the portrait
 * one stacks them centred. They are *not* two crops of one picture, so the
 * browser must pick by orientation and load exactly one: <picture> with a
 * media query, never a shared srcset.
 *
 * The masters are the PNGs beside these files; the WebPs are derived and
 * kept visually identical (see MEDIA_INDEX).
 */
const HERO_ART = {
  wide: { name: "header_16_9", widths: [1280, 1920, 2720] },
  tall: { name: "header_9_16", widths: [768, 1080, 1536] },
  /* Above this the composition is landscape. Matches --hero-split in CSS. */
  breakpoint: 900,
};

const srcSet = ({ name, widths }: { name: string; widths: number[] }) =>
  widths.map((w) => `/media/${name}-${w}.webp ${w}w`).join(", ");

/* 02 МАСШТАБ. Composed numerals, not a dashboard — the digits settle on
   entry the way the month settles in the hero. */
const SCALE = [
  { n: "60K+", label: "человек в сообществе STATUS TEAM" },
  { n: "10M+", label: "просмотров контента каждый месяц" },
  { n: "03", label: "показ команды — после «Славянского взгляда»" },
];

export default function Home() {
  return (
    <>
      <Motion />
      <Nav />

      <main id="top">
        {/* ============================================================
            HERO — the thesis: a silhouette, a horizon, a title that breathes.
            ============================================================ */}
        <div className="hero-stage">
          <section className="hero on-dark">
            {/* The photograph is the ground of the whole screen, not a panel
                beside the type. Its entrance is a plain opacity+scale settle
                (see .pre-hero in globals.css and the entrance timeline in
                Motion.tsx) — there used to be a mask-sweep "curtain" here,
                but it opened from a starting value GSAP could only apply
                once React hydrated, which was visibly later than the
                browser's first paint of the plain, fully-open CSS state.
                That produced exactly the "loads bright, then goes dark a
                beat later" flash it was meant to prevent, so it's gone. */}
            <div className="hero-frame">
              <picture>
                <source
                  media={`(min-width: ${HERO_ART.breakpoint}px)`}
                  srcSet={srcSet(HERO_ART.wide)}
                  sizes="100vw"
                />
                <source srcSet={srcSet(HERO_ART.tall)} sizes="100vw" />
                <img
                  className="hero-layer"
                  src={`/media/${HERO_ART.tall.name}-1080.webp`}
                  alt="Две модели в украшениях и белье коллекции «Пульс континента» на тёмном фоне"
                  fetchPriority="high"
                  decoding="async"
                />
              </picture>
            </div>

            <div className="hero-inner shell">
              <h1 className="hero-title" data-pulse-title>
                <span className="pulse-mask" data-hero="t1">
                  <span className="pulse-line">Пульс</span>
                </span>
                <span className="pulse-mask" data-hero="t2">
                  <span className="pulse-line">Континента</span>
                </span>
              </h1>

              {/* U+2011 (non-breaking hyphen) in "fashion‑событие" and a
                  hard space before "осени" keep that three-word phrase
                  intact as one unit — a plain hyphen and space would let
                  the browser break the compound apart or strand "осени" on
                  its own line, which is the ragged wrap this replaces. */}
              <p className="hero-statement" data-hero="statement">
                Главное fashion‑событие{" "}осени в мире нижнего белья.
              </p>

              <p className="hero-where" data-hero="where">
                <span className="hero-city">Москва</span>
                <span className="hero-dash" aria-hidden="true">
                  —
                </span>
                <span className="hero-when">
                  {/* "Ноябрь" is the real, readable value with no JS; the two
                      earlier months sit above the clip and only roll through
                      once, on the first entrance. */}
                  <span className="month" data-month>
                    <span className="month-inner">
                      <span className="month-ghost" aria-hidden="true">
                        Сентябрь
                      </span>
                      <span className="month-ghost" aria-hidden="true">
                        Октябрь
                      </span>
                      <span className="month-now">Ноябрь</span>
                    </span>
                  </span>
                  <span className="hero-year">2026</span>
                </span>
              </p>

              <div className="hero-links" data-hero="links">
                <a className="link-rule" href="#casting">
                  Стать моделью <Arrow />
                </a>
                <a className="link-rule" href="#partners">
                  Стать партнёром <Arrow />
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* ============================================================
            01 — МАНИФЕСТ (quiet chapter, paper)
            ============================================================ */}
        <section className="manifest" id="manifest">
          <div className="manifest-copy shell">
            <p className="chapter">
              <b>01</b>
              <i />
              <span>Манифест</span>
            </p>

            <h2 className="manifest-h campaign" data-reveal="quiet">
              Мы делаем показ, а не съёмку.
            </h2>

            <div className="manifest-body">
              <p data-reveal="quiet">
                STATUS TEAM собирает вечер как постановку: свет, музыка,
                хореография и коллекции работают на один ритм. «Пульс
                континента» — первый показ команды, полностью построенный
                вокруг одной температуры: жара, песок, металл, движение.
              </p>
              <p data-reveal="quiet">
                На подиуме — бельё, аксессуары и сценические образы. За
                подиумом — команда, которая собирает вечер из деталей:
                кастинг, примерки, репетиции, свет и звук.
              </p>
            </div>
          </div>

          <figure className="manifest-figure">
            <div className="media">
              <img
                src="/media/campaign-sand-drape-1400.webp"
                srcSet="/media/campaign-sand-drape-800.webp 800w, /media/campaign-sand-drape-1400.webp 1400w"
                sizes="(max-width: 900px) 100vw, 46vw"
                alt="Модель в светлом комплекте среди скульптурных драпировок песочного цвета"
                loading="lazy"
              />
            </div>
            <figcaption className="credit">Пульс континента / кампания</figcaption>
          </figure>
        </section>

        {/* ============================================================
            02 — МАСШТАБ. Numbers as typography, not a dashboard.
            ============================================================ */}
        <section className="scale on-dark">
          <div className="shell">
            <p className="chapter">
              <b>02</b>
              <i />
              <span>Масштаб</span>
            </p>

            <ul className="scale-list">
              {SCALE.map((s) => (
                <li key={s.n} data-reveal="up">
                  {/* The real value is the only text in the DOM: the digits
                      spin through a strip of numerals that is generated and
                      inserted by Motion.tsx, so with no JS this reads as a
                      plain number and never as a false figure. */}
                  <span className="scale-n struct" data-roll>
                    {s.n}
                  </span>
                  <span className="scale-l">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="scale-figure" data-reveal="mask">
            <div className="media">
              <img
                src="/media/runway-walk-1200.webp"
                srcSet="/media/runway-walk-700.webp 700w, /media/runway-walk-1200.webp 1200w"
                sizes="(max-width: 900px) 100vw, 42vw"
                alt="Модель идёт по подиуму, в зале работают фотографы"
                loading="lazy"
              />
            </div>
            <figcaption className="credit">Подиум / кампания</figcaption>
          </figure>
        </section>

        {/* ============================================================
            03 — ПОКАЗ. Sticky chapter: the title holds while the show
            scrolls past it. Second recurrence of the lock-up.
            ============================================================ */}
        <section className="show" id="show">
          <div className="show-sticky">
            <p className="chapter">
              <b>03</b>
              <i />
              <span>Показ</span>
            </p>
            <h2 className="show-title" data-pulse-title>
              <span className="pulse-line">Пульс</span>
              <span className="pulse-line">Континента</span>
            </h2>
            <p className="show-sticky-note">
              Autumn 2026 — Kinema
            </p>
          </div>

          <div className="show-panels">
            {[
              {
                img: "campaign-silhouette-drapes",
                n: "Сцена",
                cap: "Показ начинается на закате. Весь свет тёплый, тени длинные, ткань двигается вместе с моделью.",
                alt: "Модель в длинном платье с бахромой между тканевыми драпировками, за ними подсвеченная акация",
              },
              {
                img: "campaign-beaded-dusk",
                n: "Образы",
                cap: "Бисер, металл, кожа и сетка. Каждый выход собирается как отдельный образ, а не как позиция каталога.",
                alt: "Модель в расшитом бисером образе на фоне оранжевого закатного неба",
              },
              {
                img: "campaign-palms-gold",
                n: "Финал",
                cap: "Зелень, латунь и вода — финальная сцена уводит показ из саванны в тропики.",
                alt: "Модель в золотом воротнике и браслетах среди крупных пальмовых листьев",
              },
            ].map((p) => (
              <figure key={p.img} className="show-panel" data-reveal="mask">
                <div className="media">
                  <img
                    src={`/media/${p.img}-1400.webp`}
                    srcSet={`/media/${p.img}-800.webp 800w, /media/${p.img}-1400.webp 1400w`}
                    sizes="(max-width: 900px) 100vw, 44vw"
                    alt={p.alt}
                    loading="lazy"
                  />
                </div>
                <figcaption>
                  <span className="label">{p.n}</span>
                  <p>{p.cap}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ============================================================
            04 — МАТЕРИАЛЫ. Quiet triptych between two loud chapters.
            ============================================================ */}
        <section className="materials">
          <div className="shell">
            <p className="chapter">
              <b>04</b>
              <i />
              <span>Материалы</span>
            </p>
            <h2 className="materials-h campaign" data-reveal="quiet">
              Показ собирается из деталей.
            </h2>
          </div>

          <div className="materials-grid shell">
            {[
              { img: "detail-chains", cap: "Бисер и цепь", alt: "Деталь: расшитые бисером цепочки на теле модели" },
              { img: "detail-cuff", cap: "Металл", alt: "Деталь: массивный резной браслет и золотистая ткань" },
              { img: "detail-profile", cap: "Свет", alt: "Деталь: профиль модели в тёплом контровом свете" },
            ].map((m) => (
              <figure key={m.img}>
                <div className="media">
                  <img
                    src={`/media/${m.img}-900.webp`}
                    srcSet={`/media/${m.img}-500.webp 500w, /media/${m.img}-900.webp 900w`}
                    sizes="(max-width: 760px) 44vw, 28vw"
                    alt={m.alt}
                    loading="lazy"
                  />
                </div>
                <figcaption className="credit">{m.cap}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ============================================================
            05 — АТМОСФЕРА. The proof chapter: real footage, real photos.
            ============================================================ */}
        <section className="archive on-dark" id="archive">
          <div className="shell archive-head">
            <p className="chapter">
              <b>05</b>
              <i />
              <span>Атмосфера</span>
            </p>
            <h2 className="archive-h struct" data-reveal="lines">
              Славянский
              <br />
              взгляд
            </h2>
            <p className="archive-note body-text" data-reveal="up">
              Предыдущий показ STATUS TEAM. Полный зал, живая постановка и
              съёмочная команда, которая работала весь вечер. Ниже — реальные
              кадры и афтермуви.
            </p>
          </div>

          <div className="shell">
            <ShowReel />
          </div>

          <div className="archive-grid shell">
            <figure className="arch-a" data-reveal="mask">
              <div className="media">
                <img
                  src="/media/archive-backstage-bw-1200.webp"
                  srcSet="/media/archive-backstage-bw-700.webp 700w, /media/archive-backstage-bw-1200.webp 1200w"
                  sizes="(max-width: 900px) 100vw, 38vw"
                  alt="Чёрно-белый кадр: модель в вуали перед выходом на подиум"
                  loading="lazy"
                />
              </div>
              <figcaption className="credit">Backstage</figcaption>
            </figure>

            <figure className="arch-b" data-reveal="mask">
              <div className="media">
                <img
                  src="/media/archive-black-wings-1200.webp"
                  srcSet="/media/archive-black-wings-700.webp 700w, /media/archive-black-wings-1200.webp 1200w"
                  sizes="(max-width: 900px) 100vw, 30vw"
                  alt="Выход на подиум в образе с большими чёрными крыльями"
                  loading="lazy"
                />
              </div>
              <figcaption className="credit">Выход / крылья</figcaption>
            </figure>

            <figure className="arch-c" data-reveal="mask">
              <div className="media">
                <img
                  src="/media/archive-flower-crown-1200.webp"
                  srcSet="/media/archive-flower-crown-700.webp 700w, /media/archive-flower-crown-1200.webp 1200w"
                  sizes="(max-width: 900px) 100vw, 30vw"
                  alt="Модель в цветочном венке идёт по подиуму, за ней зрительный зал"
                  loading="lazy"
                />
              </div>
              <figcaption className="credit">Выход / венок</figcaption>
            </figure>
          </div>

          <p className="shell archive-credit credit">
            Фото и видео показа — Паша Доренский
          </p>
        </section>

        {/* ============================================================
            06 — УЧАСТНИКИ. Typographic index, deliberately image-free:
            the page needs a quiet beat after the archive.
            ============================================================ */}
        <section className="world">
          <div className="shell">
            <p className="chapter">
              <b>06</b>
              <i />
              <span>Участники</span>
            </p>
            <h2 className="world-h campaign" data-reveal="lines">
              Кто делает вечер
            </h2>
            <Participants />
          </div>
        </section>

        {/* ============================================================
            07 — КАСТИНГ
            ============================================================ */}
        <section className="casting on-dark" id="casting">
          <figure className="casting-figure" data-reveal="mask">
            <div className="media">
              <img
                src="/media/campaign-silver-portrait-1400.webp"
                srcSet="/media/campaign-silver-portrait-800.webp 800w, /media/campaign-silver-portrait-1400.webp 1400w"
                sizes="(max-width: 980px) 100vw, 44vw"
                alt="Портрет модели в серебряном головном уборе и украшениях на фоне неба"
                loading="lazy"
              />
            </div>
          </figure>

          <div className="casting-copy">
            <p className="chapter">
              <b>07</b>
              <i />
              <span>Кастинг</span>
            </p>
            <h2 className="casting-h struct" data-reveal="lines">
              Стать частью
              <br />
              STATUS TEAM
            </h2>

            <p className="casting-lead lead" data-reveal="up">
              Открытый кастинг для моделей. Опыт подиума желателен, но не
              обязателен — мы смотрим на фактуру, пластику и характер.
            </p>

            <ol className="casting-steps" data-reveal="up">
              <li>
                <b>01</b> Заявка с параметрами и снэпами
              </li>
              <li>
                <b>02</b> Онлайн-отбор и ответ на ваш контакт
              </li>
              <li>
                <b>03</b> Очный кастинг, примерка и репетиция
              </li>
            </ol>

            <ApplyForm kind="casting" />
          </div>
        </section>

        {/* ============================================================
            08 — ПАРТНЁРАМ. Argued with the full house, not a pitch deck.
            ============================================================ */}
        <section className="partners" id="partners">
          <div className="shell partners-head">
            <p className="chapter">
              <b>08</b>
              <i />
              <span>Партнёрам</span>
            </p>
            <h2 className="partners-h campaign" data-reveal="quiet">
              Ваш бренд — на подиуме и в кадре.
            </h2>
          </div>

          <figure className="partners-figure">
            <div className="media">
              <img
                src="/media/archive-lineup-1600.webp"
                srcSet="/media/archive-lineup-640.webp 640w, /media/archive-lineup-1000.webp 1000w, /media/archive-lineup-1600.webp 1600w"
                sizes="100vw"
                alt="Финальный выход показа: модели на подиуме, за столами полный зал гостей"
                loading="lazy"
              />
            </div>
            <figcaption className="credit">
              Славянский взгляд, финал — фото Паша Доренский
            </figcaption>
          </figure>

          <div className="shell partners-body">
            <ul className="partners-list">
              <li data-reveal="quiet">
                <h3 className="struct">Коллекция</h3>
                <p>Отдельный выход бренда с собственной сценой, светом и музыкой.</p>
              </li>
              <li data-reveal="quiet">
                <h3 className="struct">Интеграция</h3>
                <p>Присутствие в зале, в зоне гостей и в съёмке вечера.</p>
              </li>
              <li data-reveal="quiet">
                <h3 className="struct">Медиа</h3>
                <p>Контент показа: съёмка, афтермуви и публикации сообщества.</p>
              </li>
            </ul>

            <div className="partners-form">
              <ApplyForm kind="partner" />
            </div>
          </div>
        </section>

        {/* ============================================================
            09 — БИЛЕТЫ. Final payoff. Third and last recurrence of the
            lock-up, at its most compressed.
            ============================================================ */}
        <section className="tickets on-dark" id="tickets">
          <div className="shell">
            <p className="chapter">
              <b>09</b>
              <i />
              <span>Билеты</span>
            </p>

            <h2 className="tickets-title" data-pulse-title data-pulse-final>
              <span className="pulse-line">Пульс</span>
              <span className="pulse-line">Континента</span>
            </h2>

            <div className="tickets-bar">
              <div>
                <span className="label">Дата</span>
                <b>07 ноября</b>
              </div>
              <div>
                <span className="label">Площадка</span>
                <b>Kinema</b>
              </div>
              <div>
                <span className="label">Сезон</span>
                <b>Autumn 2026</b>
              </div>
            </div>

            <div className="tickets-cta">
              {/* No ticketing URL has been provided yet. The control is present
                  and styled; point it at the real link when it exists. */}
              <a className="btn btn-solid is-pending" href="#tickets" aria-disabled="true">
                Продажа откроется <Arrow />
              </a>
              <p className="tickets-note">
                Ссылка на продажу появится здесь. Чтобы узнать об открытии
                первыми — оставьте заявку в разделе{" "}
                <a className="inline-link" href="#casting">
                  кастинга
                </a>{" "}
                или{" "}
                <a className="inline-link" href="#partners">
                  партнёрства
                </a>
                .
              </p>
            </div>
          </div>

          <div className="posters shell" aria-label="Афиши показа">
            {[
              { img: "poster-key-art", alt: "Афиша показа «Пульс континента»: модель у акации, дата 7 ноября, площадка kinema" },
              { img: "poster-train", alt: "Афиша показа «Пульс континента»: модель в леопардовом комплекте с длинным шлейфом" },
              { img: "poster-duo-dusk", alt: "Афиша показа «Пульс континента»: две модели на фоне сумеречного неба" },
            ].map((p) => (
              <figure key={p.img} data-reveal="up">
                <img
                  src={`/media/${p.img}-1000.webp`}
                  srcSet={`/media/${p.img}-600.webp 600w, /media/${p.img}-1000.webp 1000w`}
                  sizes="(max-width: 760px) 74vw, 30vw"
                  alt={p.alt}
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        </section>
      </main>

      <footer className="foot on-dark">
        <div className="shell foot-inner">
          <a className="foot-brand" href="#top">
            <span>STATUS</span>
            <span>TEAM</span>
          </a>

          <nav className="foot-nav" aria-label="Навигация в подвале">
            <a href="#manifest">О показе</a>
            <a href="#show">Показ</a>
            <a href="#archive">Атмосфера</a>
            <a href="#casting">Кастинг</a>
            <a href="#partners">Партнёрам</a>
            <a href="#tickets">Билеты</a>
          </nav>

          <div className="foot-end">
            <p className="credit">Фото и видео — Паша Доренский</p>
            <p className="credit">© 2026 STATUS TEAM</p>
          </div>
        </div>
      </footer>
    </>
  );
}
