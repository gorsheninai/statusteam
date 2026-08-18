"use client";

import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);

  /* The bar is transparent over the hero and becomes a real header once the
     first screen is behind you — keyed to the hero's height, not to a magic
     pixel count, so it survives a change of hero. */
  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector<HTMLElement>(".hero-stage");
      const edge = (hero?.offsetHeight ?? window.innerHeight) * 0.72;
      setSolid(window.scrollY > edge);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock the page behind the menu. Lenis owns the scroll, so the lock goes
     through it rather than through body positioning. */
  useEffect(() => {
    if (!open) return;
    lockScroll();
    return () => unlockScroll();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className={`nav ${solid ? "is-solid" : ""}`}>
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
          <a className="nav-tickets" href="#tickets">
            Билеты
          </a>
          <button
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
