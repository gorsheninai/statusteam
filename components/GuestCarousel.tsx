export type GuestCarouselItem = {
  img: string;
  widths: [number, number];
  label: string;
  alt: string;
};

type GuestCarouselProps = {
  guests: GuestCarouselItem[];
};

/**
 * The archive frames from «Славянский взгляд», as a flat full-bleed strip.
 *
 * There is deliberately no 3D, no tween and no chrome here: the frames butt
 * against each other edge to edge, at one aspect ratio, and the row is moved
 * by the platform's own horizontal scroll. The affordance is the frame cut by
 * the viewport edge — the same one a printed contact sheet gives you — not an
 * overlaid pair of arrows. That also makes the whole component static markup:
 * no state, no GSAP, nothing to degrade when JS never arrives.
 */
export default function GuestCarousel({ guests }: GuestCarouselProps) {
  return (
    <div
      className="st2-guest-strip"
      data-st2-guest-stage
      role="region"
      aria-label="Кадры предыдущего показа «Славянский взгляд»"
      tabIndex={0}
    >
      <ul className="st2-guest-row">
        {guests.map((guest) => (
          <li className="st2-guest" key={guest.label} data-st2-guest>
            <img
              src={`/media/${guest.img}-${guest.widths[1]}.webp`}
              srcSet={`/media/${guest.img}-${guest.widths[0]}.webp ${guest.widths[0]}w, /media/${guest.img}-${guest.widths[1]}.webp ${guest.widths[1]}w`}
              sizes="(min-width: 900px) 23vw, 46vw"
              alt={guest.alt}
              loading="lazy"
              draggable={false}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
