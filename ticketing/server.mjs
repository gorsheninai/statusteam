import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import { loadConfig } from './config.mjs';
import { openStore } from './store.mjs';
import { createPayments } from './payments.mjs';
import { page, checkout, orderPage, ticketPage, staffPage } from './views.mjs';

export function createApp(config, dependencies = {}) {
  const store = openStore(config.dbPath, config.catalog);
  const { db } = store;
  const payments = dependencies.payments || createPayments(config,store);
  const mailer = dependencies.mailer || (config.smtpUrl && config.mailFrom ? nodemailer.createTransport(config.smtpUrl) : null);
  const tiers = () => config.catalog.tiers.map(t=>store.available(t.id));
  const title = o => db.prepare('SELECT title FROM tiers WHERE id=?').get(o.tier).title;
  let mailing = false;
  async function flushMail() {
    if (!mailer || mailing) return;
    mailing = true;
    try {
      for (const job of db.prepare("SELECT outbox.order_id FROM outbox JOIN orders ON orders.id=outbox.order_id WHERE sent_at IS NULL AND orders.status='paid' ORDER BY orders.created_at LIMIT 10").all()) {
        const o = store.get(job.order_id);
        try {
          await mailer.sendMail({ from:config.mailFrom,to:o.email,subject:'Ваши тестовые билеты STATUS TEAM',
            messageId:`<${o.id}@${new URL(config.baseUrl).hostname}>`,
            text:`Тестовые билеты, не для посещения мероприятия.\n${config.catalog.title}\n${config.baseUrl}/orders/${o.access}` });
          db.prepare('UPDATE outbox SET sent_at=CURRENT_TIMESTAMP,last_error=NULL WHERE order_id=?').run(o.id);
        } catch {
          db.prepare("UPDATE outbox SET attempts=attempts+1,last_error='SMTP delivery failed' WHERE order_id=?").run(o.id);
        }
      }
    } finally { mailing = false; }
  }
  async function ensurePayment(order) {
    if (order.payment_id) return order;
    // Stable idempotency key: retry after an uncertain provider response never charges twice.
    const payment = await payments.create(order);
    db.prepare("UPDATE orders SET payment_id=?,checkout_url=?,status='pending' WHERE id=? AND payment_id IS NULL").run(payment.id,payment.url,order.id);
    return store.get(order.id);
  }
  async function refresh(order) {
    order = await ensurePayment(order);
    if (['creating','pending'].includes(order.status)) order = store.settle(order.id,await payments.refresh(order));
    if (order.status === 'refund_pending') order = await refund(order.id);
    return order;
  }
  async function refund(id) {
    const order = store.beginRefund(id);
    if (order.status === 'refunded') return order;
    const result = await payments.refund(order);
    db.prepare('UPDATE orders SET refund_id=?,status=? WHERE id=?').run(result.id,result.status === 'succeeded' ? 'refunded' : result.status === 'canceled' ? 'paid' : 'refund_pending',id);
    return store.get(id);
  }
  const rates = new Map();
  function rateLimit(req) {
    const remote = req.socket.remoteAddress;
    const key = config.trustProxy && ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote) && typeof req.headers['x-real-ip']==='string'
      ? req.headers['x-real-ip'] : remote;
    const now = Date.now();
    if (rates.size > 1000) for (const [k,v] of rates) if (v.until < now) rates.delete(k);
    const bucket = rates.get(key);
    if (!bucket || bucket.until < now) { rates.set(key,{n:1,until:now+60000}); return; }
    if (++bucket.n > 30) throw Object.assign(new Error('Слишком много запросов. Попробуйте через минуту.'),{status:429});
  }
  function staff(req) {
    const supplied = Buffer.from(req.headers.authorization || '');
    const expected = Buffer.from(`Basic ${Buffer.from(`staff:${config.staffPassword}`).toString('base64')}`);
    return config.staffPassword && supplied.length === expected.length && timingSafeEqual(supplied,expected);
  }
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw Object.assign(new Error('Ожидается JSON.'),{status:415});
    let size=0; const chunks=[];
    for await (const chunk of req) { size+=chunk.length; if(size>8192) throw Object.assign(new Error('Слишком большой запрос.'),{status:413}); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw Object.assign(new Error('Неверный JSON.'),{status:400}); }
  }
  const server = createServer(async (req,res) => {
    const headers = { 'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',
      'X-Frame-Options':'DENY','Permissions-Policy':'camera=(self)',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };
    const send = (status,data,type='application/json; charset=utf-8',extra={}) => { res.writeHead(status,{...headers,'Content-Type':type,...extra}); res.end(typeof data==='object' ? JSON.stringify(data) : data); };
    const html = data => send(200,data,'text/html; charset=utf-8');
    try {
      const url = new URL(req.url,config.baseUrl), path=url.pathname;
      if (!['GET','POST'].includes(req.method)) return send(405,{error:'Метод недоступен.'});
      if (req.method==='POST') {
        // No cross-origin API or cookie-based credentials. JSON POSTs cannot be submitted by a third-party HTML form.
        if (req.headers.origin && req.headers.origin!==config.baseUrl) return send(403,{error:'Запрос с другого сайта запрещён.'});
        rateLimit(req);
      }
      if ((path==='/staff' || path.startsWith('/api/staff/')) && !staff(req)) return send(401,path.startsWith('/api/') ? {error:'Требуется служебный доступ.'} : 'Требуется служебный доступ.',path.startsWith('/api/') ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',{'WWW-Authenticate':'Basic realm="STATUS TEAM staff", charset="UTF-8"'});
      if (req.method==='GET' && path.startsWith('/assets/')) {
        const files = { '/assets/tickets.css':['./public/tickets.css','text/css'], '/assets/tickets.js':['./public/tickets.js','text/javascript'],
          '/assets/onest.woff2':['../src/assets/fonts/Onest-Variable.woff2','font/woff2'], '/assets/tenor.woff2':['../src/assets/fonts/TenorSans-Regular.woff2','font/woff2'] };
        const item=files[path];
        if (!item) return send(404,'Not found','text/plain');
        res.writeHead(200,{...headers,'Content-Type':item[1]}); return res.end(readFileSync(new URL(item[0],import.meta.url)));
      }
      if (req.method==='GET' && path==='/') return html(checkout(config.catalog,tiers()));
      if (req.method==='GET' && path==='/api/catalog') return send(200,{...config.catalog,tiers:tiers(),test:true});
      if (req.method==='POST' && path==='/api/orders') {
        const b=await body(req);
        if (typeof b.email!=='string' || b.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || !Number.isInteger(b.quantity) || b.quantity<1 || b.quantity>6 || !config.catalog.tiers.some(t=>t.id===b.tier) || !/^[0-9a-f-]{36}$/.test(b.requestKey)) return send(400,{error:'Проверьте email, категорию и количество билетов.'});
        const order=await ensurePayment(store.reserve({...b,email:b.email.trim().toLowerCase()}));
        return send(201,{url:order.checkout_url,orderUrl:`/orders/${order.access}`});
      }
      const orderRoute=path.match(/^\/(orders|api\/orders)\/([a-f0-9]{64})(\/refresh)?$/);
      if (orderRoute) {
        let o=store.byAccess(orderRoute[2]);
        if(!o) return send(404,{error:'Заказ не найден.'});
        if(req.method==='POST' && orderRoute[3]) { await body(req); o=await refresh(o); void flushMail(); return send(200,{status:o.status}); }
        if(req.method==='GET' && orderRoute[1]==='orders' && !orderRoute[3]) return html(orderPage(o,store.tickets(o.id),title(o),Boolean(db.prepare('SELECT sent_at FROM outbox WHERE order_id=?').get(o.id)?.sent_at)));
      }
      const ticketRoute=path.match(/^\/tickets\/([a-f0-9]{64})$/);
      if(req.method==='GET' && ticketRoute) {
        const t=db.prepare('SELECT * FROM tickets WHERE code=?').get(ticketRoute[1]);
        if(!t) return send(404,{error:'Билет не найден.'});
        const o=store.get(t.order_id);
        const qr=await QRCode.toDataURL(t.code,{width:260,margin:4,errorCorrectionLevel:'M'});
        return html(ticketPage(config.catalog,title(o),t,qr,o.status));
      }
      const mockRoute=path.match(/^\/mock\/([a-f0-9]{64})$/);
      if(mockRoute && config.provider==='mock') {
        const o=store.byAccess(mockRoute[1]);
        if(!o) return send(404,{error:'Заказ не найден.'});
        if(req.method==='GET') return html(page('Тестовая оплата',`<h1>Проверка покупки</h1><p>Это локальная имитация оплаты. Карта не нужна.</p><form id="mock" data-access="${o.access}"><button name="result" value="succeeded">Имитировать успешную оплату</button><button name="result" value="canceled">Отменить оплату</button></form><p id="feedback" role="status"></p>`));
        const b=await body(req);
        if(!['succeeded','canceled'].includes(b.status)) return send(400,{error:'Неверный статус.'});
        payments.mockComplete(o,b.status); await refresh(o); void flushMail();
        return send(200,{url:`/orders/${o.access}`});
      }
      if(req.method==='POST' && path==='/api/webhooks/yookassa-test' && config.provider==='yookassa-test') {
        const b=await body(req);
        // Never trust the notification object: retrieve the payment/refund using server credentials.
        const id=b.object?.id;
        const o=typeof id==='string' ? db.prepare('SELECT * FROM orders WHERE payment_id=? OR refund_id=?').get(id,id) : null;
        if(o) { await refresh(o); void flushMail(); }
        return send(200,{ok:true});
      }
      if(req.method==='GET' && path==='/staff') return html(staffPage());
      if(req.method==='GET' && path==='/api/staff/orders') return send(200,db.prepare('SELECT id,tier,quantity,total,status,created_at FROM orders ORDER BY created_at DESC LIMIT 100').all());
      if(req.method==='POST' && path==='/api/staff/checkin') {
        const b=await body(req);
        if(typeof b.code!=='string' || !/^[a-f0-9]{64}$/.test(b.code)) return send(400,{error:'Неверный формат кода билета.'});
        return send(200,store.checkIn(b.code));
      }
      const action=path.match(/^\/api\/staff\/orders\/([a-f0-9-]{36})\/(refund|resend|refresh)$/);
      if(req.method==='POST' && action) {
        await body(req);
        const o=store.get(action[1]);
        if(!o) return send(404,{error:'Заказ не найден.'});
        if(action[2]==='refund') return send(200,{status:(await refund(o.id)).status});
        if(action[2]==='refresh') return send(200,{status:(await refresh(o)).status});
        if(o.status!=='paid') return send(409,{error:'Билеты ещё не оплачены или возвращены.'});
        if(!mailer) return send(503,{error:'Отправка почты ещё не настроена.'});
        db.prepare('UPDATE outbox SET sent_at=NULL WHERE order_id=?').run(o.id); await flushMail();
        return send(200,{sent:Boolean(db.prepare('SELECT sent_at FROM outbox WHERE order_id=?').get(o.id)?.sent_at)});
      }
      return send(404,{error:'Страница не найдена.'});
    } catch(error) {
      // Do not leak provider payloads, credentials, email addresses or ticket links into logs.
      const expected=error.status || /Недостаточно|Ключ заказа|использован|недоступен для возврата/.test(error.message);
      return send(error.status || (expected ? 409 : 503),{error:expected ? error.message : 'Не удалось выполнить операцию. Повторите её с теми же данными.'});
    }
  });
  // Payment reconciliation recovers a missed webhook. Unknown results keep inventory reserved.
  let reconciling=false;
  async function reconcile() {
    if(reconciling) return; reconciling=true;
    try {
      for(const o of db.prepare("SELECT * FROM orders WHERE status IN ('creating','pending','refund_pending') ORDER BY created_at LIMIT 100").all()) {
        try { await refresh(o); } catch { /* keep reservation; retry next pass */ }
      }
      await flushMail();
    } finally { reconciling=false; }
  }
  const timer=setInterval(()=>void reconcile(),60000); timer.unref();
  server.on('close',()=>{clearInterval(timer);});
  return {server,store,payments,reconcile,flushMail};
}

if(process.argv[1] === fileURLToPath(import.meta.url)) {
  const config=loadConfig();
  const app=createApp(config);
  app.server.listen(config.port,config.host,()=>console.log(`STATUS TEAM sandbox: ${config.baseUrl}`));
  for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>app.server.close(()=>process.exit(0)));
}
