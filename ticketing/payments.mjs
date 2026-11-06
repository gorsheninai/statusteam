export function createPayments(config, store, request = fetch) {
  const { db } = store;
  const amount = order => ({ value:(order.total/100).toFixed(2), currency:'RUB' });
  async function api(path, method='GET', body, key) {
    const response = await request(`https://api.yookassa.ru/v3/${path}`, {
      method, headers:{ Authorization:`Basic ${Buffer.from(`${config.shopId}:${config.secret}`).toString('base64')}`,
        'Content-Type':'application/json', ...(key ? { 'Idempotence-Key':key } : {}) },
      body:body ? JSON.stringify(body) : undefined, signal:AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Платёжный сервис временно недоступен. Повторите запрос.');
    return response.json();
  }
  function verify(payment, order) {
    if (payment.test !== true || payment.id !== order.payment_id || payment.amount?.currency !== 'RUB' || payment.amount.value !== amount(order).value || payment.metadata?.order_id !== order.id) throw new Error('Платёж не прошёл проверку.');
    return payment;
  }
  return {
    async create(order) {
      if (config.provider === 'mock') {
        db.prepare("INSERT OR IGNORE INTO mock_payments VALUES(?,?,?,'pending')").run(order.id,order.id,order.total);
        return { id:order.id, url:`${config.baseUrl}/mock/${order.access}` };
      }
      const p = await api('payments','POST',{ amount:amount(order),capture:true,
        confirmation:{ type:'redirect',return_url:`${config.baseUrl}/orders/${order.access}` },
        description:`STATUS TEAM — тестовый заказ ${order.id}`,metadata:{order_id:order.id},
      },order.id);
      verify(p,{...order,payment_id:p.id});
      if (!p.confirmation?.confirmation_url?.startsWith('https://')) throw new Error('Нет ссылки на оплату.');
      return { id:p.id,url:p.confirmation.confirmation_url };
    },
    async refresh(order) {
      if (config.provider === 'mock') {
        const p = db.prepare('SELECT * FROM mock_payments WHERE id=?').get(order.payment_id);
        if (!p || p.amount !== order.total || p.order_id !== order.id) throw new Error('Платёж не найден.');
        return p.status;
      }
      const p = verify(await api(`payments/${encodeURIComponent(order.payment_id)}`),order);
      if (p.status === 'succeeded' && p.paid !== true) throw new Error('Платёж не оплачен.');
      return p.status;
    },
    async refund(order) {
      if (config.provider === 'mock') return { id:order.id,status:'succeeded' };
      const r = order.refund_id ? await api(`refunds/${encodeURIComponent(order.refund_id)}`) : await api('refunds','POST',{
        payment_id:order.payment_id,amount:amount(order),description:'Тестовый возврат STATUS TEAM',
      },`refund-${order.id}`);
      if (r.payment_id !== order.payment_id || r.amount?.value !== amount(order).value || r.amount?.currency !== 'RUB') throw new Error('Возврат не прошёл проверку.');
      return r;
    },
    mockComplete(order, status) {
      if (config.provider !== 'mock') throw new Error('Недоступно.');
      db.prepare("UPDATE mock_payments SET status=? WHERE id=? AND status='pending'").run(status,order.payment_id);
    },
  };
}
