import { SHOW } from "@/content/event";

export default function EventLocation({ mobile = false }: { mobile?: boolean }) {
  return (
    <p className={mobile ? "hero-location-mobile" : "hero-where"} data-hero={mobile ? undefined : "where"}>
      <span className="hero-city">{SHOW.city}</span>
      <span className="hero-when">{SHOW.period}</span>
    </p>
  );
}
