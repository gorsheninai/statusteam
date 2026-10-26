import PulseBeat from "@/components/ui/PulseBeat";
import { TENETS } from "@/content/pulse";
import { mediaFile } from "@/content/media";

export default function PulseSection() {
  return (
    <section className="pulse-scene on-dark" id="pulse" data-bg="ink">
      <div className="pulse-intro" data-sand-reveal>
        <p className="eyebrow-badge pulse-eyebrow" aria-hidden="true">
          НОВОЕ ШОУ STATUS TEAM
        </p>
        <h2 className="pulse-title" data-sand-title>
          <span className="pulse-title-fit">ПУЛЬС КОНТИНЕНТА</span>
        </h2>
        {/* The chapter's namesake, drawn: the lock-up gets the beat the
            rest of the page only implies through tracking. */}
        <PulseBeat />
      </div>

      <div className="pulse-editorial" aria-label="Четыре образа Пульса континента">
        <div className="pulse-editorial-stage">
          {TENETS.map((tenet, index) => (
            <figure
              className={`pulse-editorial-photo pulse-editorial-photo-${index + 1}`}
              key={tenet.word}
            >
              <img
                src={mediaFile(`${tenet.img}.webp`)}
                width={816}
                height={1456}
                alt={tenet.alt}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="pulse-editorial-caption">
                <span className="pulse-editorial-number">0{index + 1}</span>
                <span className="pulse-editorial-word">{tenet.word}</span>
                <span className="pulse-editorial-description">{tenet.description}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="pulse-editorial-side pulse-editorial-side-left" aria-hidden="true">
          ЧЕТЫРЕ ОБРАЗА<br />ОДИН ПУЛЬС
        </p>
        <p className="pulse-editorial-side pulse-editorial-side-right" aria-hidden="true">
          МОДА НЕ ЗНАЕТ<br />ГРАНИЦ
        </p>
        <p className="pulse-editorial-footer" aria-hidden="true">
          STATUS TEAM <span /> FASHION SHOW
        </p>
        <p className="pulse-editorial-scroll" aria-hidden="true">ЛИСТАЙТЕ <span /></p>
      </div>

      <div className="tenets" data-tenets>
        {TENETS.map((t, i) => (
          <div className="tenet" key={t.word}>
            <figure className="tenet-shot">
              <div className="media">
                <img
                  src={mediaFile(`${t.img}.webp`)}
                  width={816}
                  height={1456}
                  alt={t.alt}
                  loading={i === 0 ? undefined : "lazy"}
                  decoding="async"
                />
              </div>
            </figure>

            <p className="tenet-word">
              <span className="tenet-mask">
                <span className="tenet-in struct">{t.word}</span>
              </span>
            </p>
            <p className="tenet-description">{t.description}</p>
          </div>
        ))}

        <ol className="tenet-dots" aria-hidden="true">
          {TENETS.map((t) => (
            <li className="tenet-dot" key={t.word} />
          ))}
        </ol>
      </div>

    </section>
  );
}
