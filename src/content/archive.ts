export type GuestCarouselItem = {
  img: string;
  widths: number[];
  label: string;
  alt: string;
  src?: string;
};

export const PRESS_LOGOS = [
  "MEDIA 01",
  "MEDIA 02",
  "MEDIA 03",
  "MEDIA 04",
  "MEDIA 05",
  "MEDIA 06",
];

export const BRAND_LOGOS = [
  "PARTNER 01",
  "PARTNER 02",
  "PARTNER 03",
  "PARTNER 04",
  "PARTNER 05",
  "PARTNER 06",
];

/* 11–26: added 2026-09, placed first and in order per the client's request.
   The original curated set (show-1..10, only 7 of the 10 frames chosen) now
   trails behind them rather than being dropped. */
export const NEW_ARCHIVE_ORDER = Array.from({ length: 16 }, (_, i) => 11 + i);
export const ARCHIVE_ORDER = [1, 2, 3, 5, 4, 7, 6];

export const GUEST_SOURCES = [
  ...NEW_ARCHIVE_ORDER.map((n) => `status-${n}`),
  ...ARCHIVE_ORDER.map((n) => `show-${n}`),
];

// The first-show photo series has no frame 5 yet. Add it here when the file arrives.
export const FIRST_SHOW_PHOTOS = Array.from({ length: 22 }, (_, index) => index + 1)
  .filter((number) => number !== 5)
  .map((number): GuestCarouselItem => ({
    img: String(number),
    widths: [640, 1200],
    label: `Первый показ — кадр ${number}`,
    alt: `Первый показ STATUS TEAM, фотография ${number}`,
  }));

export const GUESTS: GuestCarouselItem[] = GUEST_SOURCES.map((img, index) => ({
  img,
  widths: [640, 900, 1200],
  label: `Гость ${String(index + 1).padStart(2, "0")}`,
  alt: "Кадр из предыдущего показа",
}));

export const STATS: Array<{
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  pad?: number;
  inlineLabel?: boolean;
}> = [
  {
    value: 60000,
    label: "Сообщество STATUS TEAM",
  },
  {
    value: 10000000,
    label: "Ежемесячный охват",
  },
  {
    value: 600,
    label: "Гостей на предыдущем шоу",
  },
  {
    value: 2,
    label: "Масштабных шоу",
    inlineLabel: true,
  },
];
