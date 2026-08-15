import Nav from "@/components/Nav";
import Motion from "@/components/Motion";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import ShowReel from "@/components/ShowReel";
import Guests from "@/components/Guests";
import Marquee from "@/components/Marquee";
import Experience from "@/components/Experience";
import Tickets from "@/components/Tickets";
import Join from "@/components/Join";
import Faq from "@/components/Faq";
import ApplyForm from "@/components/ApplyForm";
import PulseRule from "@/components/PulseRule";
import { SHOW } from "@/lib/config";

const Arrow = () => (
  <span className="arrow" aria-hidden="true">
    ↗
  </span>
);

/**
 * The hero art, as layers.
 *
 * Two crops of the same frame, not two art directions: `wide` (16:9) carries
 * the figures on the right with an empty field on the left, which is where
 * the lock-up sits; `tall` (9:16) is the same pair recomposed for a phone.
 * The browser picks by orientation, so neither is ever squeezed into the
 * other's box.
 *
 * `model` and `foreground` are optional transparent cut-outs (PNG/WebP) that
 * let part of the figure — hair, a shoulder, a piece of jewellery — sit
 * *outside* the media area, over the black. Both slots are fully wired:
 * markup, stacking, the overflow they need and their own parallax depth.
 * They render only when a file exists, so the hero costs nothing extra until
 * such a frame is delivered.
 *
 * TODO: replace-content — derived from header_16_9.png / header_9_16.png in
 * the repository root. Re-run the WebP derivation if those are replaced.
 */
const HERO_ART: {
  wide: { name: string; widths: number[] };
  tall: { name: string; widths: number[] };
  alt: string;
  model: string | null;
  foreground: string | null;
} = {
  wide: { name: "hero-wide", widths: [1200, 1800, 2560] },
  tall: { name: "hero-tall", widths: [720, 1080, 1440] },
  alt: "Две модели в чёрных образах с золотыми украшениями и ракушечными подвесками на тёмном фоне",
  model: null,
  foreground: null,
};

const srcset = (a: { name: string; widths: number[] }) =>
  a.widths.map((w) => `/media/${a.name}-${w}.webp ${w}w`).join(", ");

/* TODO: replace-content — grey placeholders until the real logo files land. */
const PRESS_LOGOS = [
  "MEDIA ONE",
  "ГЛЯНЕЦ",
  "FASHION DAILY",
  "СТОЛИЦА",
  "PODIUM",
  "VECTOR",
];
const BRAND_LOGOS = [
  "BRAND 01",
  "ATELIER",
  "STUDIO NORD",
  "LINGERIE CO",
  "AURUM",
  "KINEMA",
];

/* The four beats of the pinned chapter. Campaign imagery only — the archive
   belongs to the previous show and lives in the STATUS TEAM scene. */
const TENETS = [
  {
    word: "Ритм",
    img: "campaign-sand-drape",
    cap: "Свет, музыка и шаг в одном темпе",
    alt: "Модель в светлом комплекте среди скульптурных драпировок песочного цвета",
  },
  {
    word: "Движение",
    img: "campaign-silhouette-drapes",
    cap: "Ткань двигается вместе с моделью",
    alt: "Модель в длинном платье с бахромой между тканевыми драпировками",
  },
  {
    word: "Сила",
    img: "campaign-beaded-dusk",
    cap: "Каждый выход — отдельный образ",
    alt: "Модель в расшитом бисером образе на фоне оранжевого закатного неба",
  },
  {
    word: "Свобода",
    img: "campaign-palms-gold",
    cap: "Финал уводит показ в тропики",
    alt: "Модель в золотом воротнике и браслетах среди крупных пальмовых листьев",
  },
];

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Motion />
      <Cursor />
      <Nav />

      {/* The single ground the whole page sits on. Sections go transparent
          once GSAP is driving and this field interpolates between their
          colours; with no JS every section keeps its own. */}
      <div className="bg-field" data-bg-field aria-hidden="true" />
      <div className="blackout" data-blackout aria-hidden="true" />

      <main id="top">
        {/* ============================================================
            HERO — the thesis: a silhouette, a horizon, a title that breathes.
            One promise, one control. Nothing here explains the show.
            ============================================================ */}
        <div className="hero-stage" data-bg="ink">
          <section className="hero on-dark" id="hero">
            {/* The stage curtain that opens this is the preloader; here the
                frame only settles out of a slow push-in. */}
            <div className="hero-frame">
              <div className="hero-curtain" data-curtain>
                <div className="media hero-media">
                  {/* TODO: replace-content */}
                  <picture>
                    <source
                      media="(min-width: 900px)"
                      srcSet={srcset(HERO_ART.wide)}
                      sizes="100vw"
                    />
                    <img
                      className="hero-layer"
                      data-depth="bg"
                      src={`/media/${HERO_ART.tall.name}-1080.webp`}
                      srcSet={srcset(HERO_ART.tall)}
                      sizes="100vw"
                      alt={HERO_ART.alt}
                      fetchPriority="high"
                    />
                  </picture>
                </div>

                {HERO_ART.model && (
                  <img
                    className="hero-layer hero-layer-model"
                    data-depth="model"
                    src={`/media/${HERO_ART.model}`}
                    alt=""
                    aria-hidden="true"
                  />
                )}
                {HERO_ART.foreground && (
                  <img
                    className="hero-layer hero-layer-fg"
                    data-depth="fg"
                    src={`/media/${HERO_ART.foreground}`}
                    alt=""
                    aria-hidden="true"
                  />
                )}
              </div>
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

              {/* TODO: replace-content */}
              <p className="hero-statement" data-hero="statement">
                Крупнейший показ нижнего белья в России
              </p>

              <p className="hero-where" data-hero="where">
                <span className="hero-city">{SHOW.city}</span>
                <span className="hero-when">Ноябрь 2026</span>
              </p>

              {/* One control. The exact date lives in the ticket scene. */}
              <div className="hero-cta" data-hero="cta">
                <a className="btn btn-solid" href="#tickets" data-magnetic>
                  Билеты <Arrow />
                </a>
              </div>
            </div>
          </section>
        </div>

        <PulseRule />

        {/* ============================================================
            01 — STATUS TEAM. Four beats, each about one screen: who we
            are, what we made, who was there, what it added up to.
            ============================================================ */}
        <section className="st" id="statusteam" data-bg="burgundy">
          {/* --- beat 1 — who ---------------------------------------- */}
          <div className="beat beat-who shell">
            <p className="chapter">
              <b>01</b>
              <i />
              <span>Status Team</span>
            </p>
            <h2 className="st-name struct" data-reveal="lines">
              Status Team
            </h2>
            <p className="st-line" data-reveal="lines">
              Создаём fashion-события, которые выходят за рамки обычного показа.
            </p>
          </div>

          {/* --- beat 2 — the aftermovie ----------------------------- */}
          <div className="beat beat-reel">
            <p className="beat-label shell">
              <span className="label">Предыдущий показ</span>
              <span className="beat-label-t struct">Славянский взгляд</span>
            </p>

            {/* Pinned and scaled to full width on desktop; a plain block on
                a phone, where a pinned zoom is only a way to lose the scroll. */}
            <div className="reel-zoom" data-reel-zoom>
              <ShowReel />
            </div>
          </div>

          {/* --- beat 3 — proof -------------------------------------- */}
          <div className="beat beat-proof">
            <h3 className="beat-h struct shell" data-reveal="lines">
              Среди гостей
            </h3>
            <Guests />

            <h3 className="beat-h struct shell" data-reveal="lines">
              О нас говорили
            </h3>
            <Marquee items={PRESS_LOGOS} direction="left" label="СМИ о STATUS TEAM" />

            <h3 className="beat-h struct shell" data-reveal="lines">
              Вместе с нами
            </h3>
            <Marquee
              items={BRAND_LOGOS}
              direction="right"
              label="Бренды, работавшие со STATUS TEAM"
              speed={38}
            />

            <p className="shell credit beat-credit">
              Фото и видео показа — Паша Доренский
            </p>
          </div>

          {/* --- beat 4 — the numbers -------------------------------- */}
          <div className="beat beat-numbers">
            <div className="numbers shell">
              <p className="numbers-lead lead" data-reveal="up">
                Прошлый показ — полный зал.
              </p>

              <ul className="scale-list">
                <li data-reveal="up">
                  <span className="scale-n struct">
                    <span data-count="60" data-suffix="K+">
                      60K+
                    </span>
                  </span>
                  <span className="scale-l">
                    человек в сообществе STATUS TEAM
                  </span>
                </li>
                <li data-reveal="up">
                  <span className="scale-n struct">
                    <span data-count="10" data-suffix="M+">
                      10M+
                    </span>
                  </span>
                  <span className="scale-l">
                    просмотров контента каждый месяц
                  </span>
                </li>
                <li data-reveal="up">
                  {/* TODO: confirm-number — структура ТЗ говорит «2», на
                      текущем сайте стоит «03». */}
                  <span className="scale-n struct">
                    <span data-count="2" data-suffix="">
                      2
                    </span>
                  </span>
                  <span className="scale-l">
                    fashion-показ STATUS TEAM — после «Славянского взгляда»
                  </span>
                </li>
                <li data-reveal="up">
                  {/* TODO: replace-content — точное число гостей */}
                  <span className="scale-n struct">
                    <span data-count="600" data-suffix="+">
                      600+
                    </span>
                  </span>
                  <span className="scale-l">
                    гостей на прошлом показе
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ============================================================
            02 — ПУЛЬС КОНТИНЕНТА. The page goes black, the chapter is
            named, then four words hold the screen one at a time.
            Second recurrence of the lock-up.
            ============================================================ */}
        <section className="pulse-scene on-dark" id="pulse" data-bg="ink">
          <div className="pulse-intro shell">
            <p className="chapter">
              <b>02</b>
              <i />
              <span>Показ</span>
            </p>

            <p className="pulse-kicker" data-reveal="up">
              Следующая глава
            </p>

            <h2 className="pulse-title" data-pulse-title>
              <span className="pulse-mask">
                <span className="pulse-line">Пульс</span>
              </span>
              <span className="pulse-mask">
                <span className="pulse-line">Континента</span>
              </span>
            </h2>

            <p className="pulse-lead lead" data-reveal="up">
              Новое fashion-шоу STATUS TEAM о силе, ритме и свободе.
            </p>

            <p className="pulse-meta credit" data-reveal="up">
              нижнее бельё и аксессуары · Москва · Ноябрь 2026
            </p>
          </div>

          <div className="tenets" data-tenets>
            {TENETS.map((t, i) => (
              <div className="tenet" key={t.word}>
                <figure className="tenet-shot">
                  <div className="media">
                    <img
                      src={`/media/${t.img}-1400.webp`}
                      srcSet={`/media/${t.img}-800.webp 800w, /media/${t.img}-1400.webp 1400w`}
                      sizes="100vw"
                      alt={t.alt}
                      loading={i === 0 ? undefined : "lazy"}
                    />
                  </div>
                  <figcaption className="tenet-cap">{t.cap}</figcaption>
                </figure>

                <p className="tenet-word">
                  <span className="tenet-mask">
                    <span className="tenet-in struct">{t.word}</span>
                  </span>
                </p>
              </div>
            ))}

            <ol className="tenet-dots" aria-hidden="true">
              {TENETS.map((t) => (
                <li className="tenet-dot" key={t.word} />
              ))}
            </ol>
          </div>

          <p className="pulse-outro campaign shell" data-reveal="lines">
            Следующий показ будет другим.
          </p>
        </section>

        <PulseRule />

        {/* ============================================================
            03 — ЧТО ВАС ЖДЁТ. Quiet paper chapter after the black one.
            ============================================================ */}
        <section className="exp-scene" id="experience" data-bg="paper">
          <div className="shell">
            <p className="chapter">
              <b>03</b>
              <i />
              <span>Программа</span>
            </p>
            <h2 className="exp-h campaign" data-reveal="lines">
              Что вас ждёт
            </h2>
          </div>

          <div className="shell">
            <Experience />
          </div>

          <figure className="venue" data-reveal="mask">
            <div className="media">
              {/* TODO: replace-content — кадр площадки Kinema */}
              <img
                src="/media/runway-walk-1200.webp"
                srcSet="/media/runway-walk-700.webp 700w, /media/runway-walk-1200.webp 1200w"
                sizes="100vw"
                alt="Зал показа: подиум, свет, фотографы и зрители"
                loading="lazy"
              />
            </div>
            <figcaption className="venue-cap shell">
              <span className="label">Площадка</span>
              <b>Kinema, Москва</b>
            </figcaption>
          </figure>
        </section>

        {/* ============================================================
            04 — БИЛЕТЫ. The payoff, and the only place on the page that
            asks for money. Third and last recurrence of the lock-up.
            ============================================================ */}
        <section className="tickets on-dark" id="tickets" data-bg="ink">
          <div className="tickets-bg" aria-hidden="true">
            {/* The hero frame returns as a ground — the page closes where it
                opened. Never a poster-*: those already carry their own
                printed lock-up and the title would double. */}
            <img
              src="/media/campaign-silhouette-sun-1600.webp"
              srcSet="/media/campaign-silhouette-sun-1000.webp 1000w, /media/campaign-silhouette-sun-1600.webp 1600w"
              sizes="100vw"
              alt=""
              loading="lazy"
            />
          </div>

          <div className="shell tickets-inner">
            <p className="chapter">
              <b>04</b>
              <i />
              <span>Билеты</span>
            </p>

            <h2 className="tickets-title" data-pulse-title data-pulse-final>
              <span className="pulse-mask">
                <span className="pulse-line">Пульс</span>
              </span>
              <span className="pulse-mask">
                <span className="pulse-line">Континента</span>
              </span>
            </h2>

            <Tickets />
          </div>

          <div className="posters shell" aria-label="Афиши показа">
            {[
              {
                img: "poster-key-art",
                alt: "Афиша показа «Пульс континента»: модель у акации, дата 7 ноября, площадка kinema",
              },
              {
                img: "poster-train",
                alt: "Афиша показа «Пульс континента»: модель в леопардовом комплекте с длинным шлейфом",
              },
              {
                img: "poster-duo-dusk",
                alt: "Афиша показа «Пульс континента»: две модели на фоне сумеречного неба",
              },
            ].map((p) => (
              <figure key={p.img} data-poster>
                {/* The only images on the page not inside an aspect-ratio
                    frame, so they carry their own intrinsic box: without it
                    they reserve nothing until they load and every anchor
                    below them lands short. */}
                <img
                  src={`/media/${p.img}-1000.webp`}
                  srcSet={`/media/${p.img}-600.webp 600w, /media/${p.img}-1000.webp 1000w`}
                  sizes="(max-width: 760px) 74vw, 30vw"
                  width={1000}
                  height={1750}
                  alt={p.alt}
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        </section>

        <PulseRule />

        {/* ============================================================
            05 — СТАТЬ ЧАСТЬЮ ПУЛЬСА. Three doors: model, brand, press.
            ============================================================ */}
        <section className="join on-dark" id="join" data-bg="wine">
          <div className="shell join-head">
            <p className="chapter">
              <b>05</b>
              <i />
              <span>Участие</span>
            </p>
            <h2 className="join-h struct" data-reveal="lines">
              Стать частью пульса
            </h2>
          </div>

          <Join />
        </section>

        {/* ============================================================
            06 — ВОПРОСЫ. The last quiet beat before the footer.
            ============================================================ */}
        <section className="faq-scene on-dark" id="faq" data-bg="ink">
          <div className="shell">
            <p className="chapter">
              <b>06</b>
              <i />
              <span>Вопросы</span>
            </p>
            <h2 className="faq-h campaign" data-reveal="lines">
              Что нужно знать
            </h2>

            <Faq />
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
            <a href="#statusteam">О нас</a>
            <a href="#pulse">Показ</a>
            <a href="#experience">Что вас ждёт</a>
            <a href="#tickets">Билеты</a>
            <a href="#join">Участие</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="foot-sub">
            <p className="label">Новости показа на почту</p>
            <ApplyForm
              kind="subscribe"
              variant="inline"
              idPrefix="foot-news"
              submitLabel="Подписаться"
            />
          </div>

          <div className="foot-end">
            <p className="credit">Фото и видео — Паша Доренский</p>
            <p className="credit">© 2026 STATUS TEAM</p>
          </div>
        </div>
      </footer>
    </>
  );
}
