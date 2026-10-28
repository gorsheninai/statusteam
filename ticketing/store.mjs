import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';

export const token = () => randomBytes(32).toString('hex');
export function openStore(path, catalog) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS tiers(id TEXT PRIMARY KEY,title TEXT NOT NULL,price INTEGER NOT NULL,capacity INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,access TEXT UNIQUE NOT NULL,request_key TEXT UNIQUE NOT NULL,
      tier TEXT NOT NULL REFERENCES tiers(id),quantity INTEGER NOT NULL,email TEXT NOT NULL,total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'creating',payment_id TEXT UNIQUE,checkout_url TEXT,refund_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS tickets(code TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),used_at TEXT);
    CREATE TABLE IF NOT EXISTS outbox(order_id TEXT PRIMARY KEY REFERENCES orders(id),sent_at TEXT,attempts INTEGER NOT NULL DEFAULT 0,last_error TEXT);
    CREATE TABLE IF NOT EXISTS mock_payments(id TEXT PRIMARY KEY,order_id TEXT NOT NULL,amount INTEGER NOT NULL,status TEXT NOT NULL);`);
  for (const t of catalog.tiers) {
    // Capacity reductions must not invalidate already issued/reserved tickets.
    const occupied = db.prepare("SELECT COALESCE(SUM(quantity),0) n FROM orders WHERE tier=? AND status NOT IN ('canceled','refunded')").get(t.id).n;
    if (occupied > t.capacity) throw new Error(`Capacity below reserved inventory: ${t.id}`);
    db.prepare('INSERT INTO tiers VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,price=excluded.price,capacity=excluded.capacity').run(t.id,t.title,t.price,t.capacity);
  }
  const transaction = fn => {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  };
  const get = id => db.prepare('SELECT * FROM orders WHERE id=?').get(id);
  const available = id => {
    const tier = db.prepare('SELECT * FROM tiers WHERE id=?').get(id);
    const used = db.prepare("SELECT COALESCE(SUM(quantity),0) n FROM orders WHERE tier=? AND status NOT IN ('canceled','refunded')").get(id).n;
    return tier ? { ...tier, available: Math.max(0,tier.capacity-used) } : null;
  };
  function reserve({ tier, quantity, email, requestKey }) {
    return transaction(() => {
      const prior = db.prepare('SELECT * FROM orders WHERE request_key=?').get(requestKey);
      if (prior) {
        if (prior.tier !== tier || prior.quantity !== quantity || prior.email !== email) throw new Error('Ключ заказа уже использован с другими данными.');
        return prior;
      }
      const t = available(tier);
      if (!t || t.available < quantity) throw new Error('Недостаточно билетов в этой категории.');
      const id = randomUUID();
      db.prepare('INSERT INTO orders(id,access,request_key,tier,quantity,email,total) VALUES(?,?,?,?,?,?,?)').run(id,token(),requestKey,tier,quantity,email,t.price*quantity);
      return get(id);
    });
  }
  function settle(id, status) {
    return transaction(() => {
      const order = get(id);
      if (!order || !['creating','pending'].includes(order.status)) return order;
      if (status === 'succeeded') {
        db.prepare("UPDATE orders SET status='paid' WHERE id=?").run(id);
        for (let n=0;n<order.quantity;n++) db.prepare('INSERT INTO tickets(code,order_id) VALUES(?,?)').run(token(),id);
        db.prepare('INSERT OR IGNORE INTO outbox(order_id) VALUES(?)').run(id);
      } else if (status === 'canceled') db.prepare("UPDATE orders SET status='canceled' WHERE id=?").run(id);
      return get(id);
    });
  }
  function checkIn(code) {
    return transaction(() => {
      const t = db.prepare('SELECT tickets.*,orders.status,orders.tier FROM tickets JOIN orders ON orders.id=tickets.order_id WHERE code=?').get(code);
      if (!t || t.status !== 'paid') return { ok:false,message:'Билет недействителен' };
      if (t.used_at) return { ok:false,message:'Билет уже использован',usedAt:t.used_at };
      db.prepare('UPDATE tickets SET used_at=CURRENT_TIMESTAMP WHERE code=? AND used_at IS NULL').run(code);
      return { ok:true,message:'Вход разрешён',tier:t.tier };
    });
  }
  function beginRefund(id) {
    return transaction(() => {
      const o = get(id);
      if (!o || !['paid','refund_pending','refunded'].includes(o.status)) throw new Error('Заказ недоступен для возврата.');
      if (db.prepare('SELECT code FROM tickets WHERE order_id=? AND used_at IS NOT NULL').get(id)) throw new Error('Билет уже использован. Возврат требует ручной проверки.');
      if (o.status === 'paid') db.prepare("UPDATE orders SET status='refund_pending' WHERE id=?").run(id);
      return get(id);
    });
  }
  return { db, transaction, get, available, reserve, settle, checkIn, beginRefund,
    byAccess: access => db.prepare('SELECT * FROM orders WHERE access=?').get(access),
    tickets: id => db.prepare('SELECT code,used_at FROM tickets WHERE order_id=?').all(id),
  };
}
