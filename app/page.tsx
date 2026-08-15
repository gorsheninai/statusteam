import Nav from "@/components/Nav";
import ShowReel from "@/components/ShowReel";
import GuestRail from "@/components/GuestRail";
import StatusMetrics from "@/components/StatusMetrics";
import TicketsScene from "@/components/TicketsScene";
import JoinScene from "@/components/JoinScene";
import FAQScene from "@/components/FAQScene";
import LeadForm from "@/components/LeadForm";
import SiteMotion from "@/components/SiteMotion";

const PULSE_BEATS = [
  {
    word: "РИТМ",
    image: "/media/campaign-sand-drape-1400.webp",
    alt: "Модель в светлом образе среди скульптурных драпировок",
    note: "Музыка становится частью движения.",
    legend: "СЦЕНА · РИТМ",
  },
  {
    word: "ДВИЖЕНИЕ",
    image: "/media/campaign-silhouette-drapes-1400.webp",
    alt: "Модель среди сценических драпировок и тёплого света",
    note: "Подиум превращается в сцену.",
    legend: "ПОСТАНОВКА · ДВИЖЕНИЕ",
  },
  {
    word: "СИЛА",
    image: "/media/campaign-beaded-dusk-1400.webp",
    alt: "Модель в расшитом образе на фоне вечернего света",
    note: "Женщина не следует образу. Она создаёт его.",
    legend: "ОБРАЗЫ · СИЛА",
  },
  {
    word: "СВОБОДА",
    image: "/media/campaign-palms-gold-1400.webp",
    alt: "Модель в золотых украшениях среди пальмовых листьев",
    note: "Пульс Континента.",
    legend: "ФИНАЛ · СВОБОДА",
  },
];

const EXPERIENCE = [
  {
    title: "ПОДИУМ-ШОУ",
    text: "Новые коллекции вживую",
    image: "/media/detail-chains-900.webp",
  },
  {
    title: "LIVE-ПЕРФОРМАНС",
    text: "Музыка, свет и постановка в одном действии",
    image: "/media/detail-cuff-900.webp",
  },
  {
    title: "ГОСТИ И АТМОСФЕРА",
    text: "Fashion-индустрия, медийные лица и creators",
    image: "/media/detail-profile-900.webp",
  },
  {
    title: "AFTERPARTY",
    text: "Продолжение вечера после финального выхода",
    image: "/media/archive-black-wings-1200.webp",
  },
];

const MEDIA_PLACEHOLDERS = ["СМИ 01", "СМИ 02", "СМИ 03", "СМИ 04", "СМИ 05", "СМИ 06"];
const BRAND_PLACEHOLDERS = ["BRAND 01", "BRAND 02", "BRAND 03", "BRAND 04", "BRAND 05", "BRAND 06"];

export default function Home() {
  return (
    <>
      <SiteMotion />
      <Nav />

      <main>
        {/* ============================================================
            01 — HERO
            ============================================================ */}
        <section className="hero hero-v4 on-dark" id="hero" data-bg="#100d0c">
          <div className="hero-frame">
            <div className="hero-curtain">
              <div className="media hero-media">
                <picture>
                  <source media="(max-width: 899px)" srcSet="/media/header_9_16.png" />
                  <img
                    className="hero-layer"
                    src="/media/header_16_9.png"
                    alt="Две модели в чёрно-золотых couture-образах для показа «Пульс Континента»"
                    fetchPriority="high"
                  />
                </picture>
              </div>
            </div>
          </div>

          <div className="hero-inner shell">
            <h1 className="hero-title">
              <span className="reveal-mask"><span>ПУЛЬС</span></span>
              <span className="reveal-mask"><span>КОНТИНЕНТА</span></span>
            </h1>

            {/* TODO: replace-content — keep “Крупнейший” only if the claim is verifiable. */}
            <p className="hero-statement">Крупнейший показ нижнего белья в России</p>
            <p className="hero-where">МОСКВА · НОЯБРЬ 2026</p>

            <a className="hero-ticket-cta v4-button v4-button-gold" href="#tickets" data-magnetic>
              БИЛЕТЫ <span aria-hidden="true">↘</span>
            </a>
          </div>
        </section>

        {/* ============================================================
            02 — STATUS TEAM: brand → film → social proof → numbers
            ============================================================ */}
        <section className="scene status-v4" id="statusteam" data-bg="#86102b">
          <div className="status-brand-beat">
            <div className="status-brand-media" aria-hidden="true">
              {/* TODO: replace-content */}
              <img src="/media/archive-lineup-1600.webp" alt="" loading="lazy" />
            </div>
            <div className="status-brand-shade" aria-hidden="true" />
            <div className="shell status-brand-copy">
              <p className="scene-kicker">КТО МЫ</p>
              <h2 className="status-wordmark" data-reveal-heading>
                <span className="reveal-mask"><span>STATUS</span></span>
                <span className="reveal-mask"><span>TEAM</span></span>
              </h2>
              {/* TODO: replace-content */}
              <p className="status-positioning">Создаём fashion-события, которые выходят за рамки обычного показа.</p>
            </div>
          </div>

          <div className="status-video-beat">
            <div className="shell status-proof-head">
              <p className="scene-kicker">ПРЕДЫДУЩИЙ ПОКАЗ</p>
              <h3 className="section-title" data-reveal-heading>
                <span className="reveal-mask"><span>СЛАВЯНСКИЙ</span></span>
                <span className="reveal-mask"><span>ВЗГЛЯД</span></span>
              </h3>
            </div>
            <div className="status-video-pin">
              <div className="status-video-zoom"><ShowReel /></div>
            </div>
          </div>

          <div className="status-social-beat shell">
            <div className="proof-block">
              <div className="proof-heading">
                <span>01</span>
                <h3>СРЕДИ ГОСТЕЙ</h3>
              </div>
              <GuestRail />
            </div>

            <div className="proof-block proof-marquees">
              <div className="proof-heading">
                <span>02</span>
                <h3>О НАС ГОВОРИЛИ</h3>
              </div>
              {/* TODO: replace-content — real media logos. */}
              <div className="logo-marquee" aria-label="СМИ">
                <div className="logo-marquee-track">
                  {[...MEDIA_PLACEHOLDERS, ...MEDIA_PLACEHOLDERS].map((logo, index) => <strong key={`${logo}-${index}`}>{logo}</strong>)}
                </div>
              </div>

              <div className="proof-heading proof-heading-second">
                <span>03</span>
                <h3>ВМЕСТЕ С НАМИ</h3>
              </div>
              {/* TODO: replace-content — real partner logos. */}
              <div className="logo-marquee is-reverse" aria-label="Бренды-партнёры">
                <div className="logo-marquee-track">
                  {[...BRAND_PLACEHOLDERS, ...BRAND_PLACEHOLDERS].map((logo, index) => <strong key={`${logo}-${index}`}>{logo}</strong>)}
                </div>
              </div>
            </div>

            <p className="status-credit">Фото и видео показа — Паша Доренский</p>
          </div>

          <div className="status-numbers-beat">
            <div className="shell"><StatusMetrics /></div>
          </div>
        </section>

        {/* ============================================================
            03 — NEXT CHAPTER / PULSE
            ============================================================ */}
        <section className="scene pulse-v4 on-dark" id="pulse" data-bg="#100d0c">
          <div className="next-chapter">
            <div className="next-chapter-copy shell">
              <p className="scene-kicker">СЛЕДУЮЩАЯ ГЛАВА</p>
              <h2 className="display-title display-title-tight">
                <span>ПУЛЬС</span>
                <span>КОНТИНЕНТА</span>
              </h2>
              <p>Новое fashion-шоу STATUS TEAM о силе, ритме и свободе.</p>
            </div>
          </div>

          <div className="pulse-pin-scroll">
            <div className="pulse-pin-stage">
              <div className="pulse-progress" aria-hidden="true">
                {PULSE_BEATS.map((beat) => <i key={beat.word} />)}
              </div>

              {PULSE_BEATS.map((beat) => (
                <article className="pulse-beat" key={beat.word}>
                  <img src={beat.image} alt={beat.alt} loading="lazy" />
                  <div className="pulse-beat-shade" aria-hidden="true" />
                  <div className="pulse-beat-copy shell">
                    <span className="pulse-beat-legend">{beat.legend}</span>
                    <h3>{beat.word}</h3>
                    <p>{beat.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="pulse-outro shell">
            <p>НИЖНЕЕ БЕЛЬЁ И АКСЕССУАРЫ · МОСКВА · НОЯБРЬ 2026</p>
            <h3>СЛЕДУЮЩИЙ ПОКАЗ БУДЕТ ДРУГИМ.</h3>
          </div>
        </section>

        {/* ============================================================
            04 — EXPERIENCE
            ============================================================ */}
        <section className="scene experience-v4" id="experience" data-bg="#f1ece4">
          <div className="shell experience-head">
            <p className="scene-kicker">07 НОЯБРЯ · KINEMA</p>
            <h2 className="display-title display-title-dark" data-reveal-heading>
              <span className="reveal-mask"><span>ЧТО ВАС</span></span>
              <span className="reveal-mask"><span>ЖДЁТ</span></span>
            </h2>
          </div>

          <div className="experience-list shell">
            {EXPERIENCE.map((item, index) => (
              <article className="experience-row" key={item.title} data-reveal-up>
                <span className="experience-index">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {/* TODO: replace-content */}
                <img className="experience-hover-media" src={item.image} alt="" loading="lazy" aria-hidden="true" />
                <img className="experience-mobile-media" src={item.image} alt={`Визуал: ${item.title}`} loading="lazy" />
              </article>
            ))}
          </div>

          {/* TODO: confirm — replace AFTERPARTY if it is not part of the final event program. */}
          <div className="venue-block">
            {/* TODO: replace-content — replace with a real Kinema venue photograph. */}
            <img src="/media/archive-lineup-1600.webp" alt="Площадка показа Kinema, Москва — временный кадр" loading="lazy" />
            <div className="venue-shade" aria-hidden="true" />
            <div className="venue-copy shell">
              <span>ПЛОЩАДКА</span>
              <h3>KINEMA</h3>
              <p>МОСКВА</p>
            </div>
          </div>
        </section>

        {/* ============================================================
            05 — TICKETS
            ============================================================ */}
        <TicketsScene />

        {/* ============================================================
            06 — JOIN
            ============================================================ */}
        <JoinScene />

        {/* ============================================================
            07 — FAQ
            ============================================================ */}
        <FAQScene />
      </main>

      <footer className="foot foot-v4 on-dark">
        <div className="shell foot-v4-grid">
          <a className="foot-v4-brand" href="#hero">STATUS<br />TEAM</a>
          <nav aria-label="Навигация в подвале">
            <a href="#statusteam">О нас</a>
            <a href="#pulse">Показ</a>
            <a href="#experience">Что вас ждёт</a>
            <a href="#tickets">Билеты</a>
            <a href="#join">Участие</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="foot-v4-subscribe">
            <strong>НОВОСТИ ПОКАЗА</strong>
            <LeadForm kind="newsletter" compact />
          </div>
        </div>
        <div className="shell foot-v4-bottom">
          <span>Фото и видео — Паша Доренский</span>
          <span>© 2026 STATUS TEAM</span>
        </div>
      </footer>
    </>
  );
}
