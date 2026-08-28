"use client";

import { useEffect, useRef, useState } from "react";
import { lockScroll, unlockScroll } from "@/lib/scroll";

/* Four destinations plus the ticket button. Anything more and the row starts
   competing with the show's own title. */
const LINKS = [
  { href: "#statusteam", label: "О нас" },
  { href: "#pulse", label: "Показ" },
  { href: "#experience", label: "Что вас ждёт" },
  { href: "#join", label: "Участие" },
];

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [hideOnMobileImpact, setHideOnMobileImpact] = useState(false);
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* The CTA belongs to every section after the hero. Measure the actual
     beginning of page two instead of inferring it from any viewport or hero
     height: both can diverge from the visual transition on mobile Safari. */
  useEffect(() => {
    const onScroll = () => {
      const pageTwo = document.querySelector<HTMLElement>("#statusteam");
      const impact = document.querySelector<HTMLElement>(".st2-impact");
      const navHeight =
        document.querySelector<HTMLElement>(".nav")?.offsetHeight ?? 72;
      const isPastFirstScreen = pageTwo
        ? pageTwo.getBoundingClientRect().top <= navHeight
        : window.scrollY >= window.innerHeight;

      setSolid(isPastFirstScreen);
      setShowTickets(isPastFirstScreen);

      /* Screen two is the film itself on phones. Keep it genuinely full-frame,
         then restore the header as soon as the following archive enters. */
      const impactRect = impact?.getBoundingClientRect();
      setHideOnMobileImpact(
        window.matchMedia("(max-width: 767px)").matches &&
          Boolean(
              impactRect &&
              impactRect.top <= navHeight &&
              /* A small boundary tolerance restores the bar as the archive
                 reaches it; fractional Safari geometry otherwise keeps the
                 film state alive for one extra scroll step. */
              impactRect.bottom > navHeight + 12,
          ),
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* Lock the page behind the menu, keep keyboard focus inside the dialog and
     return it to the opener after close. */
  useEffect(() => {
    if (!open) return;

    lockScroll();
    const opener = openerRef.current;
    const menu = menuRef.current;
    const focusable = () =>
      menu
        ? Array.from(
            menu.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];
    const focusFrame = window.requestAnimationFrame(() => focusable()[0]?.focus());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const controls = focusable();
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKey);
      unlockScroll();
      window.requestAnimationFrame(() => opener?.focus());
    };
  }, [open]);

  return (
    <>
      <header
        className={`nav ${solid ? "is-solid" : ""}${hideOnMobileImpact ? " is-mobile-impact-hidden" : ""}`}
      >
        <a className="nav-brand" href="#top" aria-label="STATUS TEAM — наверх">
          {/* The real wordmark, derived from logo.PNG in the repository root.
              Sized by height so the 6.43:1 lock-up keeps its proportions. */}
          <img
            src="/media/brand-status-team-320.webp"
            srcSet="/media/brand-status-team-320.webp 320w, /media/brand-status-team-640.webp 640w"
            sizes="(max-width: 900px) 104px, 132px"
            width={320}
            height={50}
            alt="STATUS TEAM"
            fetchPriority="high"
          />
        </a>

        <nav className="nav-links" aria-label="Разделы сайта">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-end">
          {/* Never inside the burger: the ticket button is the one control
              that has to be reachable from every pixel of the page. */}
          <a
            className={`nav-tickets ${showTickets ? "is-visible" : ""}`}
            href="#tickets"
            aria-hidden={!showTickets}
            tabIndex={showTickets ? undefined : -1}
          >
            Билеты
          </a>
          <button
            ref={openerRef}
            className="nav-burger"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
            aria-expanded={open}
            aria-controls="site-menu"
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Kept in the DOM and driven by a class: the close animation needs an
          element to play on, and `inert` keeps it out of the tab order and
          the accessibility tree while it is shut. */}
      <div
        ref={menuRef}
        id="site-menu"
        className={`menu ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Меню"
        inert={!open}
      >
        <div className="menu-inner">
          <div className="menu-top">
            <span className="label">Меню</span>
            <button
              className="menu-close"
              onClick={() => setOpen(false)}
              aria-label="Закрыть меню"
            >
              Закрыть
            </button>
          </div>

          <ul className="menu-list">
            {[...LINKS, { href: "#faq", label: "FAQ" }].map((l, i) => (
              <li key={l.href} style={{ ["--i" as string]: i }}>
                <a onClick={() => setOpen(false)} href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="menu-foot">
            <a className="menu-tickets" href="#tickets" onClick={() => setOpen(false)}>
              Билеты
            </a>
            <span>Москва · Ноябрь 2026</span>
          </div>
        </div>
      </div>

    </>
  );
}
