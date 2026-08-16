import Nav from "@/components/Nav";
import Motion from "@/components/Motion";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import StatusTeamScene from "@/components/StatusTeamScene";
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

/* The four beats of the pinned chapter. Campaign imagery only — the archive
   belongs to the previous show and lives in the STATUS TEAM scene. */
const TENETS = [
  {
    word: "Ритм",
    img: "campaign-sand-drape",
    alt: "Модель в светлом комплекте среди скульптурных драпировок песочного цвета",
  },
  {
    word: "Движение",
    img: "campaign-silhouette-drapes",
    alt: "Модель в длинном платье с бахромой между тканевыми драпировками",
  },
  {
    word: "Сила",
    img: "campaign-beaded-dusk",
    alt: "Модель в расшитом бисером образе на фоне оранжевого закатного неба",
  },
  {
    word: "Свобода",
    img: "campaign-palms-gold",
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

        <StatusTeamScene />

        {/* ============================================================
            02 — ПУЛЬС КОНТИНЕНТА. The page goes black, the chapter is
            named, then four words hold the screen one at a time.
            Second recurrence of the lock-up.
            ============================================================ */}
        <section className="pulse-scene on-dark" id="pulse" data-bg="ink">
          <div className="pulse-intro" data-sand-reveal>
            <h2 className="pulse-title" data-sand-title>
              <span className="pulse-title-fit">ПУЛЬС КОНТИНЕНТА</span>
            </h2>
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

        </section>

        <PulseRule />

        {/* ============================================================
            03 — ЧТО ВАС ЖДЁТ. Quiet paper chapter after the black one.
            ============================================================ */}
        <section className="exp-scene" id="experience" data-bg="paper">
          <div className="shell">
            <h2 className="exp-h campaign" data-reveal="lines">
              Что вас ждёт
            </h2>
          </div>

          <div className="shell">
            <Experience />
          </div>

          {/* The Kinema photograph does not exist yet, and a stand-in frame
              here would be a second use of a campaign shot. Type carries it
              instead — which is also the louder move. */}
          <div className="venue">
            <p className="venue-label label">Площадка</p>
            <p className="venue-name struct" data-reveal="lines">
              Kinema
            </p>
            <p className="venue-where">Москва · 07 ноября 2026</p>
          </div>

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

        {/* ============================================================
            05 — СТАТЬ ЧАСТЬЮ ПУЛЬСА. Three doors: model, brand, press.
            ============================================================ */}
        <section className="join on-dark" id="join" data-bg="wine">
          <div className="shell join-head">
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
          <div className="shell faq-shell">
            <div className="faq-layout">
              <div className="faq-intro" data-reveal="up">
                <h2 className="faq-h campaign">Что нужно знать</h2>
                <p className="faq-copy">
                  Ответы на главные вопросы о шоу, дресс-коде и билетах.
                  Остались вопросы?
                </p>
                <a
                  className="faq-contact"
                  href="https://t.me/statusteamru"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>Служба заботы / Telegram</span>
                  <span className="faq-contact-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </div>

              <Faq />
            </div>
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
