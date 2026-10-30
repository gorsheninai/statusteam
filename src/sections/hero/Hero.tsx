import EventLocation from "./EventLocation";
import { HERO_ART } from "@/content/hero";
import { mediaFile, mediaSrcSet } from "@/content/media";

const srcset = (art: { name: string; widths: number[] }) => mediaSrcSet(art.name, art.widths);

const Arrow = () => (
  <span className="arrow" aria-hidden="true">
    ↗
  </span>
);

export default function Hero() {
  return (
    <div className="hero-stage" data-bg="ink">
      <section className="hero on-dark" id="hero">
        {/* Temporary marker for the Beget automatic deployment check. */}
        <div
          data-deploy-test="1"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "110px",
            right: "24px",
            zIndex: 50,
            fontSize: "clamp(120px, 20vw, 280px)",
            fontWeight: 500,
            lineHeight: 1,
            color: "#fff",
            textShadow: "0 4px 24px #000",
            pointerEvents: "none",
          }}
        >
          1
        </div>
        <EventLocation mobile />
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
                  src={mediaFile(`${HERO_ART.tall.name}-1080.webp`)}
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
                src={mediaFile(`${HERO_ART.model}`)}
                alt=""
                aria-hidden="true"
              />
            )}
            {HERO_ART.foreground && (
              <img
                className="hero-layer hero-layer-fg"
                data-depth="fg"
                src={mediaFile(`${HERO_ART.foreground}`)}
                alt=""
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <div className="hero-inner shell">
          <p className="hero-kicker" aria-hidden="true">
            <span />
            Объединяем континенты
          </p>
          <h1 className="hero-title" data-pulse-title>
            <span className="pulse-mask" data-hero="t1">
              <span className="pulse-line">Пульс</span>
            </span>
            <span className="pulse-mask" data-hero="t2">
              <span className="pulse-line">Континента</span>
            </span>
          </h1>

          {/* Desktop: this wrapper lets the CTA row inherit the exact
              intrinsic width of the red offer line. On mobile it becomes
              display:contents, so the approved phone composition is unchanged. */}
          <div className="hero-offer-stack">
            {/* TODO: replace-content */}
            <p className="hero-statement" data-hero="statement">
              <span className="hero-statement-anchor">Крупнейший fashion-показ</span>
              <span className="hero-statement-script">нижнего белья в России</span>
            </p>

            <div className="hero-action">
              <EventLocation />

              {/* Two equal paths: preorder and participation. The exact
                  date still lives in the ticket scene. */}
              <div className="hero-cta" data-hero="cta">
                <a className="btn btn-solid" href="#tickets">
                  <span className="hero-btn-label">Предзаказать билет</span>
                  <Arrow />
                </a>
                <a className="btn btn-pulse" href="#join">
                  <span className="hero-btn-label">Моделям, брендам, партнёрам и СМИ</span>
                  <Arrow />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
