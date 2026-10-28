import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadConfig(env = process.env) {
  const provider = env.PAYMENT_PROVIDER || 'mock';
  const baseUrl = env.TICKETING_BASE_URL || 'http://127.0.0.1:4320';
  const url = new URL(baseUrl);
  if (!['mock', 'yookassa-test'].includes(provider)) throw new Error('Only sandbox providers are supported. Live sales are not enabled.');
  if (url.pathname !== '/' || url.search || url.hash) throw new Error('TICKETING_BASE_URL must be an origin, without a path.');
  if (provider === 'mock' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Mock checkout is local only.');
  if (provider === 'yookassa-test' && (!env.YOOKASSA_SHOP_ID || !env.YOOKASSA_SECRET_KEY?.startsWith('test_'))) throw new Error('A YooKassa test shop and test_ key are required.');
  if (provider === 'yookassa-test' && url.protocol !== 'https:') throw new Error('YooKassa notifications require a public HTTPS origin.');
  const staffPassword = env.TICKETING_STAFF_PASSWORD || '';
  if (staffPassword && staffPassword.length < 24) throw new Error('Staff password must have at least 24 characters.');
  if (provider === 'yookassa-test' && !staffPassword) throw new Error('Set TICKETING_STAFF_PASSWORD.');
  const catalog = env.TICKETING_CATALOG ? JSON.parse(readFileSync(resolve(env.TICKETING_CATALOG), 'utf8')) : {
    title: 'ПУЛЬС КОНТИНЕНТА', date: 'Демонстрация продажи', venue: 'Тестовое мероприятие',
    tiers: [{ id: 'demo', title: 'Тестовый билет', price: 10000, capacity: 10 }],
  };
  if (!catalog.title || !catalog.date || !catalog.venue || !Array.isArray(catalog.tiers) || !catalog.tiers.length) throw new Error('Invalid event catalog.');
  const ids = new Set();
  for (const tier of catalog.tiers) {
    if (!/^[a-z0-9-]{1,40}$/.test(tier.id) || ids.has(tier.id) || !tier.title || !Number.isSafeInteger(tier.price) || tier.price < 100 || !Number.isSafeInteger(tier.capacity) || tier.capacity < 1) throw new Error('Invalid ticket tier. Prices are integer kopecks.');
    ids.add(tier.id);
  }
  return { provider, baseUrl: url.origin, host: env.TICKETING_HOST || '127.0.0.1', port: Number(env.PORT || 4320),
    dbPath: env.TICKETING_DB || './data/tickets.sqlite', catalog, staffPassword,
    shopId: env.YOOKASSA_SHOP_ID, secret: env.YOOKASSA_SECRET_KEY,
    smtpUrl: env.SMTP_URL, mailFrom: env.MAIL_FROM, trustProxy:env.TICKETING_TRUST_PROXY === '1',
  };
}
