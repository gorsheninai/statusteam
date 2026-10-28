/* Same-origin checkout. No payment credentials or prices are trusted from this file. */
const $ = selector => document.querySelector(selector);
const feedback = message => { if ($('#feedback')) $('#feedback').textContent = message; };
async function api(path, data) {
  const response = await fetch(path, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data) });
  const body = await response.json();
  if(!response.ok) throw new Error(body.error || 'Не удалось выполнить действие. Повторите попытку.');
  return body;
}
function handle(form, submit) {
  form?.addEventListener('submit',async event => {
    event.preventDefault();
    if(form.dataset.busy) return;
    form.dataset.busy='true';
    const buttons=[...form.querySelectorAll('button')]; buttons.forEach(b=>b.disabled=true);
    feedback('Обрабатываем…');
    try { await submit(event); } catch(error) { feedback(error.message); }
    finally { delete form.dataset.busy; buttons.forEach(b=>b.disabled=false); }
  });
}
const checkout=$('#checkout');
if(checkout) {
  function total() {
    const option=checkout.elements.tier.selectedOptions[0];
    $('#total').textContent=option ? new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB'}).format(Number(option.dataset.price)*Number(checkout.elements.quantity.value)/100) : 'Билеты закончились';
    checkout.querySelector('button').disabled=!option || option.disabled;
  }
  checkout.addEventListener('input',total); total();
  handle(checkout,async()=>{
    const values=Object.fromEntries(new FormData(checkout)); values.quantity=Number(values.quantity);
    const signature=JSON.stringify(values);
    let draft;
    try { draft=JSON.parse(sessionStorage.getItem('ticket-order')); } catch { /* new draft */ }
    if(!draft || draft.signature!==signature) draft={signature,key:crypto.randomUUID()};
    sessionStorage.setItem('ticket-order',JSON.stringify(draft));
    const result=await api('/api/orders',{...values,requestKey:draft.key});
    sessionStorage.removeItem('ticket-order');
    location.assign(result.url);
  });
}
$('#refresh')?.addEventListener('click',async event=>{
  const button=event.currentTarget; button.disabled=true;
  try { await api(`/api/orders/${button.dataset.access}/refresh`,{}); location.reload(); }
  catch(error) { feedback(error.message); button.disabled=false; }
});
handle($('#mock'),async event=>{
  const result=await api(`/mock/${event.currentTarget.dataset.access}`,{status:event.submitter.value});
  location.assign(result.url);
});
$('#print')?.addEventListener('click',()=>window.print());
async function checkin(code) {
  const result=await api('/api/staff/checkin',{code:code.trim()});
  $('#scan-result').textContent=result.message + (result.usedAt ? ` · ${result.usedAt} UTC` : '');
  $('#scan-result').dataset.valid=String(result.ok);
}
handle($('#checkin'),async event=>{ await checkin(event.currentTarget.elements.code.value); feedback(''); });
$('#camera')?.addEventListener('click',async()=>{
  if(!('BarcodeDetector' in window)) return feedback('В этом браузере сканирование камерой недоступно. Введите код или используйте совместимый браузер.');
  let stream;
  try {
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
    const video=$('#scanner'); video.srcObject=stream; video.hidden=false; await video.play();
    $('#camera').disabled=true;
    const detector=new BarcodeDetector({formats:['qr_code']});
    const stop=()=>{stream.getTracks().forEach(t=>t.stop());video.hidden=true;$('#camera').disabled=false;};
    // One scan per explicit start, so holding the phone over a code cannot consume another ticket.
    const deadline=Date.now()+30000;
    async function scan() {
      try {
        const codes=await detector.detect(video);
        if(codes[0]) { stop(); await checkin(codes[0].rawValue); return; }
        if(Date.now()>deadline) { stop(); feedback('Код не найден. Повторите сканирование.'); return; }
        setTimeout(scan,250);
      } catch(error) { stop(); feedback(error.message); }
    }
    void scan();
    window.addEventListener('pagehide',stop,{once:true});
  } catch { stream?.getTracks().forEach(t=>t.stop()); feedback('Нет доступа к камере. Разрешите его или введите код вручную.'); }
});
async function loadOrders() {
  const response=await fetch('/api/staff/orders');
  if(!response.ok) throw new Error('Войдите с учётной записью сотрудника.');
  const orders=await response.json(), root=$('#orders'); root.replaceChildren();
  for(const order of orders) {
    const card=document.createElement('article'); card.className='order-row';
    const info=document.createElement('p'); info.textContent=`${order.id} · ${order.tier} · ${order.quantity} шт. · ${order.status}`; card.append(info);
    for(const [action,label] of [['refresh','Проверить оплату'],['resend','Отправить билеты повторно'],['refund','Вернуть оплату']]) {
      if(action==='resend' && order.status!=='paid') continue;
      if(action==='refund' && !['paid','refund_pending'].includes(order.status)) continue;
      const button=document.createElement('button'); button.textContent=label;
      button.addEventListener('click',async()=>{
        if(action==='refund' && !confirm('Вернуть полную сумму заказа и аннулировать все его билеты?')) return;
        button.disabled=true;
        try {
          const result=await api(`/api/staff/orders/${order.id}/${action}`,{});
          feedback(action==='resend' ? result.sent ? 'Письмо отправлено.' : 'Письмо в очереди. Проверьте SMTP.' : `Статус заказа: ${result.status}`);
          await loadOrders();
        } catch(error) { feedback(error.message); button.disabled=false; }
      });
      card.append(button);
    }
    root.append(card);
  }
}
$('#load-orders')?.addEventListener('click',()=>loadOrders().catch(error=>feedback(error.message)));
