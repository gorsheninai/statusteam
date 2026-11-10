import { copyFileSync } from 'node:fs';
copyFileSync(new URL('../../node_modules/@zxing/browser/umd/zxing-browser.min.js',import.meta.url),new URL('../public/scanner.min.js',import.meta.url));
copyFileSync(new URL('../../node_modules/@zxing/browser/LICENSE',import.meta.url),new URL('../public/scanner-LICENSE',import.meta.url));
