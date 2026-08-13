"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* "О показе" and "Показ" named the same thing twice. One entry now covers
   the opening chapter; the show chapter is still reachable by scrolling. */
const LINKS = [
  { href: "#manifest", label: "О проекте" },
  { href: "#archive", label: "Атмосфера" },
  { href: "#casting", label: "Кастинг" },
  { href: "#partners", label: "Партнёрам" },
];

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock the page behind the mobile menu without losing scroll position. */
  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const { body } = document;
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      window.scrollTo(0, y);
    };
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
          <a className="nav-tickets" href="#tickets">
            Билеты
          </a>
          <button
            className="nav-burger"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
            aria-expanded={open}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="menu"
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: reduce ? 0.15 : 0.62, ease: [0.65, 0, 0.35, 1] }}
          >
            <div className="menu-media" aria-hidden="true">
              <img
                src="/media/campaign-silhouette-drapes-640.webp"
                alt=""
                loading="lazy"
              />
            </div>

            <div className="menu-inner">
              <div className="menu-top">
                <span className="label">Меню</span>
                <button
                  className="menu-close"
                  onClick={() => setOpen(false)}
                  aria-label="Закрыть меню"
                  autoFocus
                >
                  Закрыть
                </button>
              </div>

              <ul className="menu-list">
                {[...LINKS, { href: "#tickets", label: "Билеты" }].map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={reduce ? false : { y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      duration: 0.6,
                      delay: reduce ? 0 : 0.16 + i * 0.055,
                      ease: [0.22, 0.8, 0.28, 1],
                    }}
                  >
                    <a onClick={() => setOpen(false)} href={l.href}>
                      <b>{String(i + 1).padStart(2, "0")}</b>
                      {l.label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              {/* Date and venue are not confirmed, so the menu says only what
                  the hero says. Put them back when they are locked. */}
              <div className="menu-foot">
                <span>Москва</span>
                <span>Ноябрь 2026</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
