"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#statusteam", label: "О нас" },
  { href: "#pulse", label: "Показ" },
  { href: "#experience", label: "Что вас ждёт" },
  { href: "#join", label: "Участие" },
];

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("#hero");
    if (!hero) {
      setSolid(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setSolid(!entry.isIntersecting || entry.intersectionRatio < 0.12),
      { threshold: [0, 0.12, 0.5] },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const body = document.body;
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
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <>
      <header className={`nav nav-v4 ${solid ? "is-solid" : ""}`}>
        <a className="nav-brand" href="#hero" aria-label="STATUS TEAM — наверх">
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
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>

        <div className="nav-end">
          <a className="nav-tickets" href="#tickets" data-magnetic>
            БИЛЕТЫ
          </a>
          <button
            className="nav-burger"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`menu menu-v4 ${open ? "is-open" : ""}`} id="mobile-menu" aria-hidden={!open}>
        <div className="menu-v4-bg" aria-hidden="true">
          <img src="/media/campaign-silhouette-drapes-640.webp" alt="" loading="lazy" />
        </div>
        <div className="menu-v4-inner">
          <div className="menu-v4-top">
            <span>STATUS TEAM</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть меню">ЗАКРЫТЬ</button>
          </div>
          <nav aria-label="Мобильная навигация">
            {[...LINKS, { href: "#tickets", label: "Билеты" }, { href: "#faq", label: "FAQ" }].map((link, index) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <span>{link.label}</span>
              </a>
            ))}
          </nav>
          <div className="menu-v4-foot"><span>МОСКВА</span><span>НОЯБРЬ 2026</span></div>
        </div>
      </div>
    </>
  );
}
