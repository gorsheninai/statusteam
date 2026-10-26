import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "src/content/media-files.json"), "utf8"));
const failures = [];
const urls = new Set();
const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => !entry.name.startsWith(".")).flatMap((entry) => {
  const name = path.join(dir, entry.name);
  return entry.isDirectory() ? files(name) : [name];
});

for (const [name, url] of Object.entries(catalog)) {
  const target = path.resolve(root, "public", `.${url}`);
  if (!url.startsWith("/media/") || !target.startsWith(path.join(root, "public/media") + path.sep)) {
    failures.push(`Invalid public media URL: ${url}`);
    continue;
  }
  if (path.basename(url) !== name) failures.push(`Catalog key differs from filename: ${name}`);
  if (!fs.existsSync(target)) failures.push(`Missing catalog file: ${url}`);
  if (urls.has(url)) failures.push(`Duplicate catalog URL: ${url}`);
  urls.add(url);
}

for (const file of files(path.join(root, "public/media"))) {
  const url = "/" + path.relative(path.join(root, "public"), file).split(path.sep).join("/");
  if (!urls.has(url)) failures.push(`Uncatalogued file: ${url}`);
  if (!/\.(webp|mp4)$/i.test(file)) failures.push(`Source or documentation in public media: ${url}`);
}

const out = path.join(root, "out");
if (!fs.existsSync(path.join(out, "index.html"))) {
  failures.push("Build is missing. Run npm run build before npm run verify:media.");
} else {
  let count = 0;
  for (const file of files(out).filter((name) => name.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8");
    for (const tag of html.matchAll(/<(?:img|video|source)\b[^>]*>/g)) {
      for (const attr of tag[0].matchAll(/\b(?:src|srcSet|srcset|poster|data-src)="([^"]+)"/g)) {
        for (const url of attr[1].split(",").map((item) => item.trim().split(/\s+/)[0])) {
          if (!url.startsWith("/media/")) continue;
          count++;
          if (!urls.has(url)) failures.push(`Export references unknown asset: ${url}`);
          if (!fs.existsSync(path.join(out, url))) failures.push(`Asset missing from export: ${url}`);
        }
      }
    }
  }
  console.log(`Checked ${Object.keys(catalog).length} catalog files and ${count} exported media references.`);
}

if (failures.length) {
  console.error(failures.map((message) => `- ${message}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Media catalog and exported paths are valid.");
}
