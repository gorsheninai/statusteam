import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../config.mjs';
import { createApp } from '../server.mjs';
import { createPayments } from '../payments.mjs';
import { openStore } from '../store.mjs';

async function fixture(t, capacity=4, dependencies={}) {
  const dir=mkdtempSync(join(tmpdir(),'statusteam-'));
  const config=loadConfig({TICKETING_DB:join(dir,'tickets.sqlite'),TICKETING_STAFF_PASSWORD:'a-test-password-with-at-least-24-characters'});
  config.catalog.tiers[0].capacity=capacity;
  const app=createApp(config,dependencies);
  app.server.listen(0,'127.0.0.1'); await once(app.server,'listening');
  config.baseUrl=`http://127.0.0.1:${app.server.address().port}`;
  const auth=`Basic ${Buffer.from(`staff:${config.staffPassword}`).toString('base64')}`;
  async function post(path,data={},staff=false,origin=config.baseUrl) {
    const response=await fetch(config.baseUrl+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(staff ? {Authorization:auth} : {})},body:JSON.stringify(data)});
    return {status:response.status,body:await response.json()};
  }
  const order=async(quantity=1,requestKey=randomUUID(),extra={})=>{
    const result=await post('/api/orders',{tier:'demo',quantity,email:'buyer@example.org',requestKey,...extra});
    const record=result.body.orderUrl ? app.store.byAccess(result.body.orderUrl.split('/').pop()) : null;
    return {...result,record,requestKey};
  };
  const pay=record=>post(`/mock/${record.access}`,{status:'succeeded'});
  t.after(async()=>{await new Promise(resolve=>app.server.close(resolve));app.store.db.close();rmSync(dir,{recursive:true,force:true});});
  return {...app,config,post,order,pay,auth};
}

test('price comes from server, payment is idempotent, each quantity gets a unique QR',async t=>{
  const f=await fixture(t); const o=await f.order(2,randomUUID(),{total:1,price:1});
  assert.equal(o.status,201); assert.equal(o.record.total,20000);
  assert.equal(f.store.tickets(o.record.id).length,0);
  const replay=await f.order(2,o.requestKey); assert.equal(replay.record.id,o.record.id);
  assert.equal((await f.pay(o.record)).status,200);
  await f.pay(o.record);
  const tickets=f.store.tickets(o.record.id);
  assert.equal(tickets.length,2); assert.notEqual(tickets[0].code,tickets[1].code);
  assert.equal(f.store.available('demo').available,2);
  const response=await fetch(f.config.baseUrl+`/tickets/${tickets[0].code}`);
  const html=await response.text(); assert.match(html,/data:image\/png;base64/); assert.match(html,/Тестовый билет/);
});

test('concurrent orders cannot oversell and canceled payment releases inventory',async t=>{
  const f=await fixture(t,1);
  const results=await Promise.all([f.order(),f.order()]);
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  const o=results.find(r=>r.record).record;
  await f.post(`/mock/${o.access}`,{status:'canceled'});
  assert.equal(f.store.available('demo').available,1);
  assert.equal(f.store.tickets(o.id).length,0);
  assert.equal((await f.order()).status,201);
});

test('check-in requires staff and is atomic for duplicate scans',async t=>{
  const f=await fixture(t); const o=await f.order(); await f.pay(o.record);
  const code=f.store.tickets(o.record.id)[0].code;
  assert.equal((await f.post('/api/staff/checkin',{code})).status,401);
  const results=await Promise.all([f.post('/api/staff/checkin',{code},true),f.post('/api/staff/checkin',{code},true)]);
  assert.equal(results.filter(r=>r.body.ok).length,1);
  assert.equal((await f.post(`/api/staff/orders/${o.record.id}/refund`,{},true)).status,409);
});

test('refund invalidates all tickets, restores inventory, and can be safely retried',async t=>{
  const f=await fixture(t); const o=await f.order(2); await f.pay(o.record);
  const code=f.store.tickets(o.record.id)[0].code;
  assert.equal((await f.post(`/api/staff/orders/${o.record.id}/refund`,{},true)).body.status,'refunded');
  assert.equal((await f.post(`/api/staff/orders/${o.record.id}/refund`,{},true)).body.status,'refunded');
  assert.equal((await f.post('/api/staff/checkin',{code},true)).body.ok,false);
  assert.equal(f.store.available('demo').available,4);
  await f.pay(o.record); assert.equal(f.store.get(o.record.id).status,'refunded');
});

test('reject bad quantity, mismatched idempotency payload, CSRF, and leaked order IDs',async t=>{
  const f=await fixture(t);
  for(const q of [0,-1,7,1.5,'1']) assert.equal((await f.order(q)).status,400);
  const o=await f.order(); assert.equal((await f.order(2,o.requestKey)).status,409);
  assert.equal((await f.post('/api/orders',{},false,'https://attacker.example')).status,403);
  assert.equal((await fetch(f.config.baseUrl+`/orders/${o.record.id}`)).status,404);
  assert.equal((await fetch(f.config.baseUrl+'/api/staff/orders')).status,401);
  const publicCatalog=await (await fetch(f.config.baseUrl+'/api/catalog')).text();
  assert.doesNotMatch(publicCatalog,/buyer@example.org|request_key/);
});

test('mail outbox retries failures and does not generate new tickets on resend',async t=>{
  let attempts=0;
  const f=await fixture(t,4,{mailer:{async sendMail(){if(++attempts===1) throw new Error('SMTP down');}}});
  const o=await f.order(); await f.pay(o.record);
  // A background flush may still be running after HTTP completion.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.store.db.prepare('SELECT attempts FROM outbox').get().attempts,1);
  await f.flushMail();
  assert.ok(f.store.db.prepare('SELECT sent_at FROM outbox').get().sent_at);
  await f.post(`/api/staff/orders/${o.record.id}/resend`,{},true);
  assert.equal(f.store.tickets(o.record.id).length,1); assert.equal(attempts,3);
});

test('uncertain payment creation holds stock and reuses the provider idempotency key',async t=>{
  const f=await fixture(t,1);
  const original=f.payments.create; let calls=0;
  f.payments.create=async order=>{const result=await original(order);if(++calls===1) throw new Error('Lost response');return result;};
  const key=randomUUID(); assert.equal((await f.order(1,key)).status,503);
  assert.equal(f.store.available('demo').available,0);
  const retried=await f.order(1,key); assert.equal(retried.status,201);
  assert.equal(f.store.db.prepare('SELECT COUNT(*) n FROM mock_payments').get().n,1);
});

test('YooKassa adapter independently verifies test flag, amount, currency, ID and metadata',async t=>{
  const f=await fixture(t); const o=await f.order();
  const good={id:o.record.payment_id,test:true,status:'succeeded',paid:true,amount:{value:'100.00',currency:'RUB'},metadata:{order_id:o.record.id}};
  const cfg={...f.config,provider:'yookassa-test',shopId:'123',secret:'test_placeholder'};
  for(const bad of [{test:false},{id:'other'},{amount:{value:'0.01',currency:'RUB'}},{amount:{value:'100.00',currency:'USD'}},{metadata:{order_id:'other'}},{paid:false}]) {
    const payments=createPayments(cfg,f.store,async()=>({ok:true,json:async()=>({...good,...bad})}));
    await assert.rejects(payments.refresh(o.record));
  }
  const payments=createPayments(cfg,f.store,async()=>({ok:true,json:async()=>good}));
  assert.equal(await payments.refresh(o.record),'succeeded');
});

test('configuration blocks live providers and non-test keys',()=>{
  assert.throws(()=>loadConfig({PAYMENT_PROVIDER:'yookassa-live'}));
  assert.throws(()=>loadConfig({PAYMENT_PROVIDER:'mock',TICKETING_BASE_URL:'https://public.example'}));
  assert.throws(()=>loadConfig({PAYMENT_PROVIDER:'yookassa-test',YOOKASSA_SHOP_ID:'1',YOOKASSA_SECRET_KEY:'live_key'}));
});

test('orders, tickets, pending mail and inventory survive reopening the database',async t=>{
  const f=await fixture(t); const o=await f.order(2); await f.pay(o.record);
  const codes=f.store.tickets(o.record.id).map(ticket=>ticket.code);
  const reopened=openStore(f.config.dbPath,f.config.catalog);
  try {
    assert.equal(reopened.get(o.record.id).status,'paid');
    assert.deepEqual(reopened.tickets(o.record.id).map(ticket=>ticket.code),codes);
    assert.equal(reopened.available('demo').available,2);
    assert.equal(reopened.db.prepare('SELECT COUNT(*) n FROM outbox WHERE sent_at IS NULL').get().n,1);
  } finally { reopened.db.close(); }
});

test('without SMTP the service never reports successful mail delivery',async t=>{
  const f=await fixture(t);const o=await f.order();await f.pay(o.record);
  const r=await f.post(`/api/staff/orders/${o.record.id}/resend`,{},true);
  assert.equal(r.status,503);assert.match(r.body.error,/почты/);
  assert.equal(f.store.db.prepare('SELECT sent_at FROM outbox').get().sent_at,null);
});
