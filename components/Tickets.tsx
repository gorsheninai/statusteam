"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ApplyForm from "./ApplyForm";
import { SALES_OPEN, SHOW, TICKETS_URL, TIERS, WAVES } from "@/lib/config";

/* ---------------------------------------------------------------- waves */

type Left = { d: number; h: number; m: number; s: number } | null;

function remaining(iso: string): Left {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor(s / 3600) % 24,
    m: Math.floor(s / 60) % 60,
    s: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One number in the countdown. Re-keying on the value remounts the digit,
 * which is what plays the slide — no timeline to keep in sync with the clock.
 */
function Unit({ value, label }: { value: string; label: string }) {
  return (
    <span className="tick">
      <span className="tick-win">
        <b key={value}>{value}</b>
      </span>
      <i>{label}</i>
    </span>
  );
}

/* ---------------------------------------------------------------- tilt */

/**
 * The category cards lean toward the pointer and carry a sand highlight along
 * their hairline — the one place a gradient is allowed, because it is a rule
 * lighting up, not a fill. Desktop pointers only; everywhere else the cards
 * are flat and the information is identical.
 */
function useTilt(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ok =
      window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ok) return;

    const cards = gsap.utils.toArray<HTMLElement>(".tier", el);
    const cleanups = cards.map((card) => {
      const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
      const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });

      const onMove = (e: PointerEvent) => {
        const b = card.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width;
        const py = (e.clientY - b.top) / b.height;
        rx((0.5 - py) * 6);
        ry((px - 0.5) * 6);
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
      };
      const onLeave = () => {
        rx(0);
        ry(0);
      };

      card.addEventListener("pointermove", onMove, { passive: true });
      card.addEventListener("pointerleave", onLeave);
      return () => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
        gsap.set(card, { clearProps: "all" });
      };
    });

    return () => cleanups.forEach((fn) => fn());
  }, [root]);
}

/* ---------------------------------------------------------------- scene */

export default function Tickets() {
  const gridRef = useRef<HTMLDivElement>(null);
  useTilt(gridRef);

  /* Index 0 on the server and on the first client paint, so hydration has
     nothing to disagree about; the clock corrects it a tick later. */
  const [wave, setWave] = useState(0);
  const [left, setLeft] = useState<Left>(null);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const i = WAVES.findIndex((w) => new Date(w.endsAt).getTime() > now);
      const active = i === -1 ? WAVES.length - 1 : i;
      setWave(active);
      setLeft(remaining(WAVES[active].endsAt));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div className="tickets-bar">
        <div>
          <span className="label">Дата</span>
          <b>{SHOW.date}</b>
        </div>
        <div>
          <span className="label">Площадка</span>
          <b>
            {SHOW.venue}, {SHOW.city}
          </b>
        </div>
        <div>
          <span className="label">Начало</span>
          {/* TODO: replace-content — точное время подтверждает заказчик */}
          <b>19:00</b>
        </div>
      </div>

      {/* ---- categories ------------------------------------------- */}
      {/* TODO: replace-content (названия и наполнение согласует заказчик) */}
      <div className="tiers" ref={gridRef}>
        {TIERS.map((t) => (
          <article className="tier" key={t.id} data-reveal="up">
            <div className="tier-inner">
              <h3 className="tier-name struct">{t.name}</h3>
              <p className="tier-price">{t.price}</p>
              <ul className="tier-list">
                {t.includes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      {/* ---- price waves ------------------------------------------ */}
      <div className="waves" data-reveal="up">
        <ol className="wave-row" aria-label="Волны цен">
          {WAVES.map((w, i) => (
            <li
              key={w.id}
              className={`wave ${i === wave ? "is-active" : ""} ${
                i < wave ? "is-past" : ""
              }`}
              aria-current={i === wave ? "step" : undefined}
            >
              {w.name}
            </li>
          ))}
        </ol>

        <div className="wave-clock" role="timer" aria-live="off">
          <span className="label">
            {left ? `До конца волны «${WAVES[wave].name}»` : "Волна закрыта"}
          </span>
          <div className="wave-timer">
            {left ? (
              <>
                <Unit value={pad(left.d)} label="дн" />
                <Unit value={pad(left.h)} label="ч" />
                <Unit value={pad(left.m)} label="мин" />
                <Unit value={pad(left.s)} label="сек" />
              </>
            ) : (
              /* Rendered on the server and until the clock runs: dashes, never
                 a fake countdown. */
              <>
                <Unit value="—" label="дн" />
                <Unit value="—" label="ч" />
                <Unit value="—" label="мин" />
                <Unit value="—" label="сек" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---- the one control ------------------------------------- */}
      <div className="tickets-cta">
        {SALES_OPEN && TICKETS_URL ? (
          <a
            className="btn btn-solid btn-buy"
            href={TICKETS_URL}
            data-magnetic
            rel="noopener"
          >
            Купить билет
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        ) : (
          <button
            className="btn btn-solid btn-buy"
            type="button"
            data-magnetic
            aria-expanded={askOpen}
            aria-controls="ticket-access"
            onClick={() => setAskOpen((v) => !v)}
          >
            Получить доступ первым
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </button>
        )}

        <div
          id="ticket-access"
          className={`panel ${askOpen ? "is-open" : ""}`}
          aria-hidden={!askOpen}
        >
          <div className="panel-inner">
            <p className="tickets-note">
              Продажи ещё не открыты. Оставьте контакт — пришлём ссылку на
              билеты раньше, чем она появится в открытом доступе.
            </p>
            <ApplyForm kind="access" consent />
          </div>
        </div>

        {/* Stays after sales open: the newsletter is not the waiting list. */}
        <div className="tickets-sub">
          <p className="label">Узнавать новости показа</p>
          <ApplyForm
            kind="subscribe"
            variant="inline"
            idPrefix="news"
            submitLabel="Подписаться"
          />
        </div>
      </div>
    </>
  );
}
