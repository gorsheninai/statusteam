"use client";
import { FIRST_SHOW_PHOTOS, GUESTS, STATS } from "@/content/archive";

import ImpactVideo from "./ImpactVideo";
import { CONTENT } from "@/content/event";
import GuestCarousel from "@/sections/status-team/GuestCarousel";

export default function StatusTeamScene() {
  return (
    <section className="st st-page-two" id="statusteam" data-bg="ink">
      <section className="st2-impact" aria-labelledby="st2-impact-title">
        <ImpactVideo />

        <div className="st2-impact-copy" data-st2-impact-copy>
          <h2 id="st2-impact-title">
            <span className="st2-impact-primary">
              <span>Создаём fashion-события</span>
            </span>
            <span className="st2-impact-subgroup">
              <span className="st2-impact-tier2a">
                за пределами
                <span className="st2-impact-hairline" aria-hidden="true" />
              </span>
              <span className="st2-impact-tier2b">подиума</span>
            </span>
          </h2>
        </div>
      </section>

      {CONTENT.guests && (
        <section className="st2-vanguard st2-shell" aria-labelledby="st2-vanguard-title">
          <header className="st2-vanguard-head" data-st2-section-title>
            <p className="st2-vanguard-kicker">Предыдущий показ · Москва · Сколково</p>
            <h2 id="st2-vanguard-title" className="st2-vanguard-tag">
              <span className="st2-vanguard-tag-line">Славянский взгляд</span>
            </h2>
            <div className="st2-vanguard-intro st2-first-show-copy">
              <p className="st2-vanguard-lead">
                30 моделей и знаковые бренды — fashion-шоу о сильной, чувственной и самобытной женственности.
              </p>
            </div>
          </header>

          <GuestCarousel guests={GUESTS} />
        </section>
      )}

      <section className="st2-first-show st2-shell" aria-labelledby="st2-first-show-title">
        <header className="st2-first-show-head">
          <h2 id="st2-first-show-title" className="st2-vanguard-tag st2-first-show-title">
            <span className="st2-vanguard-tag-line">Ход королевы</span>
          </h2>
          <p className="st2-first-show-copy st2-vanguard-lead">
            История о женской силе, свободе самовыражения и уверенности быть собой.
          </p>
        </header>
        <GuestCarousel
          guests={FIRST_SHOW_PHOTOS}
          carouselLabel="Фотографии первого показа STATUS TEAM"
        />
      </section>

      <section className="st2-scale" aria-label="Масштаб STATUS TEAM в цифрах">
        <div className="st2-shell st2-scale-shell" data-st2-stats-band>
          <header className="st2-scale-head">
            <h2
              className="st2-scale-title"
              data-reveal="lines"
              data-desktop-reveal
            >
              Масштаб в цифрах
            </h2>
          </header>

          <ul className="st2-stats" data-st2-stats-list>
            {STATS.map((stat) => (
              <li
                className={stat.inlineLabel ? "is-sentence" : undefined}
                key={stat.label}
                data-st2-stat
              >
                <span className="st2-stat-number">
                  {stat.prefix && (
                    <span className="st2-stat-prefix">{stat.prefix}</span>
                  )}
                  <span className="st2-stat-figure">
                    <span data-count={stat.value} data-pad={stat.pad} data-st2-count>
                      {stat.pad
                        ? String(stat.value).padStart(stat.pad, "0")
                        : stat.value.toLocaleString("ru-RU")}
                    </span>
                    {stat.suffix && (
                      <span className="st2-stat-suffix" data-st2-stat-suffix>
                        {stat.suffix}
                      </span>
                    )}
                    <span
                      className="st2-stat-sheen"
                      data-st2-stat-sheen
                      aria-hidden="true"
                    />
                  </span>
                  {stat.inlineLabel && (
                    <span className="st2-stat-inline-label">{stat.label}</span>
                  )}
                </span>
                {!stat.inlineLabel && (
                  <span className="st2-stat-label">{stat.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}
