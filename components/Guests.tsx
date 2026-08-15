const GUESTS = [
  {
    img: "archive-flower-crown",
    w: [700, 1200],
    label: "Гость 01",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "archive-black-wings",
    w: [700, 1200],
    label: "Гость 02",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "archive-backstage-bw",
    w: [700, 1200],
    label: "Гость 03",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "archive-lineup",
    w: [640, 1000],
    label: "Гость 04",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
];

/**
 * Neutral editorial placeholders only. No real guest is named until the
 * production portraits and confirmed guest list arrive.
 */
export default function Guests() {
  return (
    <div className="guests" role="list" aria-label="Гости STATUS TEAM">
      {GUESTS.map((guest, index) => (
        <figure
          className="guest"
          key={guest.label}
          role="listitem"
          data-reveal="mask"
          data-st-guest={index}
        >
          <div className="media">
            <img
              src={`/media/${guest.img}-${guest.w[1]}.webp`}
              srcSet={`/media/${guest.img}-${guest.w[0]}.webp ${guest.w[0]}w, /media/${guest.img}-${guest.w[1]}.webp ${guest.w[1]}w`}
              sizes="(max-width: 700px) 46vw, (max-width: 1199px) 22vw, 10vw"
              alt={guest.alt}
              loading="lazy"
              draggable={false}
            />
          </div>
          <figcaption>
            <b>{guest.label}</b>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
