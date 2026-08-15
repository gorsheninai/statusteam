"use client";

import { useEffect, useRef, useState } from "react";

type MetricProps = {
  target: number;
  suffix?: string;
  label: string;
  className?: string;
};

function Metric({ target, suffix = "", label, className = "" }: MetricProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || started) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStarted(true);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target]);

  return (
    <div className={`status-metric ${className}`} ref={ref}>
      <strong>{value}{suffix}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function StatusMetrics() {
  return (
    <div className="status-metrics" aria-label="STATUS TEAM в цифрах">
      <Metric target={60} suffix="K+" label="сообщество STATUS TEAM" />
      <Metric target={10} suffix="M+" label="просмотров в месяц" className="is-gold" />
      {/* TODO: confirm-number — current brief confirms this is the second fashion show. */}
      <Metric target={2} label="fashion-показ STATUS TEAM" className="is-wine" />
      {/* TODO: replace-content — replace with verified facts from the previous show. */}
      <div className="status-fact"><strong>FULL</strong><span>полный зал</span></div>
      <div className="status-fact"><strong>N</strong><span>гостей</span></div>
    </div>
  );
}
