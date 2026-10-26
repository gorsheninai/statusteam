import files from "./media-files.json";

/** Browser-ready assets only. Original filenames are stable catalog keys. */
export const MEDIA_FILES: Readonly<Record<string, string>> = files;

export function mediaFile(name: string): string {
  const url = MEDIA_FILES[name];
  if (!url) throw new Error(`Unknown media asset: ${name}`);
  return url;
}

export function mediaSrcSet(name: string, widths: readonly number[]): string {
  return widths.map((width) => `${mediaFile(`${name}-${width}.webp`)} ${width}w`).join(", ");
}

export const MEDIA = {
  brand: { small: mediaFile("brand-status-team-320.webp"), large: mediaFile("brand-status-team-640.webp") },
  showReel: { video: mediaFile("СТАТУС_HQ_со_звуком_10-15MB.mp4"), poster: mediaFile("show-reel-poster.webp") },
  socialPreview: mediaFile("campaign-silhouette-sun-1600.webp"),
};
