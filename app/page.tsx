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
    height: 2498,
    alt: "Модель в светлом комплекте среди скульптурных драпировок песочного цвета",
  },
  {
    word: "Движение",
    img: "campaign-silhouette-drapes",
    height: 2498,
    alt: "Модель в длинном платье с бахромой между тканевыми драпировками",
  },
  {
    word: "Сила",
    img: "campaign-beaded-dusk",
    height: 1866,
    alt: "Модель в расшитом бисером образе на фоне оранжевого закатного неба",
  },
  {
    word: "Свобода",
    img: "campaign-palms-gold",
    height: 1738,
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
                      width={1080}
                      height={1913}
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
                <span className="hero-statement-anchor">Крупнейший fashion-показ</span>
                <span className="hero-statement-script">нижнего белья в России</span>
              </p>

              <p className="hero-where" data-hero="where">
                <span className="hero-city">{SHOW.city}</span>
                <span className="hero-when">Ноябрь 2026</span>
              </p>

              {/* One control. The exact date lives in the ticket scene. */}
              <div className="hero-cta" data-hero="cta">
                <a className="btn btn-solid" href="#tickets">
                  Купить билет <Arrow />
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
            <p className="eyebrow-badge pulse-eyebrow" aria-hidden="true">
              НОВОЕ ШОУ STATUS TEAM
            </p>
            <h2 className="pulse-title" data-sand-title>
              <span className="pulse-title-fit">ПУЛЬС КОНТИНЕНТА</span>
            </h2>
          </div>

          <div className="tenets" data-tenets>
            {TENETS.map((t, i) => (
              <div className="tenet" key={t.word}>
                <figure className="tenet-shot">
                  <div className="media">
                    <picture>
                      {/* An 800px source is still above 2x at common iPhone
                          widths while cutting the four decoded textures by
                          roughly two thirds. Wider screens keep 1400px. */}
                      <source
                        media="(max-width: 599px)"
                        srcSet={`/media/${t.img}-800.webp`}
                      />
                      <img
                        src={`/media/${t.img}-1400.webp`}
                        srcSet={`/media/${t.img}-800.webp 800w, /media/${t.img}-1400.webp 1400w`}
                        sizes="100vw"
                        width={1400}
                        height={t.height}
                        alt={t.alt}
                        loading={i === 0 ? undefined : "lazy"}
                      />
                    </picture>
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
              В программе
            </h2>
          </div>

          <div className="shell">
            <Experience />
          </div>

          {/* Only the city is confirmed. Type carries the announcement until
              the date and venue are ready to be published. */}
          <div className="venue">
            <p className="venue-label label">Место проведения</p>
            <p className="venue-name struct" data-reveal="lines">
              Москва
            </p>
            <p className="venue-where">Дата и площадка будут объявлены позже</p>
          </div>

        </section>

        {/* ============================================================
            04 — БИЛЕТЫ. One compact preorder invitation: no repeated
            campaign title, placeholder inventory or decorative photograph.
            ============================================================ */}
        <section className="tickets on-dark" id="tickets" data-bg="wine">
          <div className="shell tickets-inner">
            <Tickets />
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
                <h2 className="faq-h">Частые вопросы</h2>
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
          <div className="foot-col foot-col-brand">
            <a className="foot-brand" href="#top" aria-label="STATUS TEAM — наверх">
              <picture>
                <source
                  srcSet="/media/brand-status-team-640.webp 2x"
                  type="image/webp"
                />
                <img
                  src="/media/brand-status-team-320.webp"
                  alt="STATUS TEAM"
                  width="320"
                  height="50"
                />
              </picture>
            </a>

            {/* Политика конфиденциальности и пользовательское соглашение
                ещё не написаны — ссылок в никуда быть не должно, поэтому
                это пока текст, а не <a>. Как только страницы появятся,
                достаточно обернуть их в ссылки. */}
            <div className="foot-legal">
              <span>Политика конфиденциальности</span>
              <span>Пользовательское соглашение</span>
            </div>
          </div>

          <nav className="foot-col foot-nav" aria-label="Навигация в подвале">
            <p className="foot-col-title">Меню</p>
            <a href="#pulse">О показе</a>
            <a href="#experience">В программе</a>
            <a href="#join">Аккредитация СМИ и блогеров</a>
            <a href="#join">Партнёрство и участие</a>
          </nav>

          <div className="foot-col foot-contacts">
            <p className="foot-col-title">Контакты</p>
            <a
              className="foot-contact-link"
              href="https://t.me/statusteamru"
              target="_blank"
              rel="noreferrer"
            >
              Служба заботы / Telegram
            </a>
            <div className="foot-social">
              <a
                className="foot-social-link"
                href="https://t.me/statusteamru"
                target="_blank"
                rel="noreferrer"
                aria-label="STATUS TEAM в Telegram"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.4 4.2 3.2 11c-.9.35-.9 1.63.02 1.95l4.2 1.46 1.62 5.02c.2.62 1 .78 1.43.28l2.27-2.6 4.4 3.24c.68.5 1.65.14 1.84-.68l3.03-13.5c.2-.9-.7-1.63-1.6-1.26Zm-3.1 3.24-7.1 6.4-.3 3.3-1.4-4.3 8.8-5.4Z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="foot-col foot-sub">
            <p className="foot-col-title">Подпишитесь на нашу рассылку</p>
            <ApplyForm
              kind="subscribe"
              variant="inline"
              idPrefix="foot-news"
              submitLabel="Отправить"
            />
          </div>
        </div>

        <div className="shell foot-end">
          <p className="credit">© 2026 STATUS TEAM. Все права защищены.</p>
        </div>
      </footer>
    </>
  );
}
