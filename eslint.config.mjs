import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      /**
       * This site ships hand-authored <img> with explicit srcset/sizes.
       *
       * Every photograph is art-directed: the crop, object-position and the
       * exact widths are design decisions recorded in public/media/MEDIA_INDEX.md,
       * and the WebP derivatives are generated ahead of time from the originals.
       * next/image would re-decide sizing at runtime and pull in `sharp`, which
       * this project deliberately avoids (images.unoptimized is set).
       */
      "@next/next/no-img-element": "off",
    },
  },
  { ignores: [".next/**", "node_modules/**", "out/**", "tests/**", "next-env.d.ts"] },
];

export default config;
