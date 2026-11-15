'use strict';
const $=id=>document.getElementById(id), page=document.body.dataset.page;
let csrf='',checked='',cameraControl=null,refundRequest=null;
const errorLabels={control_order_exists:'Контрольный заказ уже создан. Откройте его в списке заказов.',control_ticket:'Контрольный билет недействителен для прохода.',ticket_not_found:'Билет не найден',invalid_ticket:'Билет недействителен',used:'Уже использован',login_required:'Войдите в кабинет',invalid_login:'Неверный логин или пароль',csrf_required:'Сессия изменилась — обновите страницу',partial_refunds_not_approved:'Частичные возвраты пока не согласованы',rate_limited:'Слишком много запросов — повторите позже'};
const message=text=>{$('message').textContent=errorLabels[text]||text;};
const labels={valid:'Действителен',used:'Уже использован',refunded:'Возвращён / недействителен',refund_pending:'Возврат обрабатывается: проход заблокирован',admitted:'Проход подтверждён',reserved:'Ожидает оплаты',paid:'Оплачен',canceled:'Платёж отменён',expired:'Срок брони истёк. Оформите новый заказ.'};
async function api(route,data={}){const res=await fetch('index.php?r='+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,csrf}),credentials:'same-origin'});const v=await res.json();if(!res.ok)throw Error(v.error||'Ошибка сервера');return v;}
const token=()=>location.hash.slice(1);
const orderToken=page==='return'?token():/^order-([a-f0-9]{64})$/.exec(token())?.[1];
const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
function bind(id,fn){$(id)?.addEventListener('click',()=>Promise.resolve().then(fn).catch(e=>message(e.message)));}
function form(id,fn){$(id)?.addEventListener('submit',e=>{e.preventDefault();const el=e.currentTarget;const data=Object.fromEntries(new FormData(el));const button=el.querySelector('button');button.disabled=true;Promise.resolve().then(()=>fn(data)).catch(e=>message(e.message)).finally(()=>{button.disabled=false;});});}
function clearPurchaseKeys() {
 try {
  for (const purpose of ['purchase','test-purchase','control-purchase']) sessionStorage.removeItem('status-request-'+purpose);
 } catch { /* browser storage may be disabled */ }
}

let statusTimer;
let checkingStatus=false;
const maxStatusRetries=10;
let checksRemaining=maxStatusRetries;
async function status() {
 if (checkingStatus) return;
 clearTimeout(statusTimer);
 checkingStatus=true;
 $('return-actions').hidden=true;
 message('Открываем билет…');
 let shouldRetry=false;
 try {
  const verifyPayment=(maxStatusRetries-checksRemaining)%3===0;
  const v=await api('order-status',{token:orderToken,verifyPayment});
  if(v.status==='paid' && v.ticketUrl) {
   const url=new URL(v.ticketUrl,location.origin);
   if(url.origin!==location.origin || !/^\/api(?:-test)?\/index\.php$/.test(url.pathname) ||
      url.search!=='?r=ticket' || !/^#[a-f0-9]{64}$/.test(url.hash)) throw Error('Не удалось открыть билет.');
   clearPurchaseKeys();
   location.replace(url.href);
   return;
  }
  shouldRetry=v.status==='reserved'||v.status==='paid';
  const retrying=shouldRetry&&checksRemaining>0;
  if(!retrying) message(v.status==='paid'?'Билет ещё готовится. Попробуйте открыть его ещё раз.':labels[v.status]||'Статус заказа уточняется.');
  $('pay').hidden=retrying||!v.confirmationUrl;
  if(v.confirmationUrl) $('pay').href=v.confirmationUrl;
  $('new-order').hidden=!['canceled','refunded','expired'].includes(v.status);
 } catch (e) {
  message(e.message==='order_not_found'?'Заказ не найден. Откройте ссылку из письма или вернитесь на сайт.':'Не удалось проверить оплату. Попробуйте ещё раз.');
 } finally {
  checkingStatus=false;
 }
 if(shouldRetry&&checksRemaining>0) {
  checksRemaining--;
  statusTimer=setTimeout(status,2000);
 } else {
  $('return-actions').hidden=false;
 }
}
async function check(){checked='';$('admit').disabled=true;const v=await api('check',{token:$('token').value.trim()});$('check-result').textContent=v.number+' · '+(labels[v.status]||v.status);if(v.status==='valid'){checked=$('token').value.trim();$('admit').disabled=false;}}
async function staff(){const s=await api('me');$('login').hidden=true;$('staff').hidden=false;$('admin').hidden=s.role!=='admin';}
async function dashboard() {
 const data=await api('dashboard');
 const sections={orders:'Заказы',applications:'Заявки',mail:'Письма',refunds:'Возвраты'};
 const columns={
  buyer_name:'Покупатель',buyer_email:'Email',buyer_phone:'Телефон',ticket_number:'Билет',
  amount:'Сумма (коп.)',ticket_status:'Статус билета',status:'Статус',payment_status:'Оплата',receipt_status:'Чек',
  created_at:'Создан (UTC)',sent_at:'Отправлено (UTC)',id:'ID',order_id:'Заказ',
  reference_id:'ID записи',attempts:'Попытки',last_error:'Последняя ошибка',kind:'Тип',
 };
 const statuses={paid:'Оплачен',reserved:'Забронирован',valid:'Действителен',used:'Использован',refunded:'Возвращён',refund_pending:'Возврат в обработке',canceled:'Отменён',expired:'Просрочен',succeeded:'Успешно',pending:'В ожидании',sent:'Отправлено',sending:'Отправляется',failed:'Ошибка',waiting_for_capture:'Ожидает подтверждения'};
 const list=$('lists');
 list.replaceChildren();
 for(const [name,rows] of Object.entries(data)){
  const title=document.createElement('h3');
  title.textContent=sections[name]??name;
  const table=document.createElement('table');
  if(rows.length){
   const header=table.insertRow();
   for(const column of Object.keys(rows[0])){
    const th=document.createElement('th');
    th.scope='col';
    th.textContent=columns[column]??column;
    header.append(th);
   }
   for(const row of rows){
    const tr=table.insertRow();
    for(const [column,value] of Object.entries(row)){
     tr.insertCell().textContent=column==='status'||column.endsWith('_status')
      ? (statuses[value]??value??'—') : (value??'—');
    }
   }
  }
  list.append(title,table);
 }
}
function setupTestCheckout() {
 const checkout=$('test-checkout');
 if (!checkout) return;
 const control=checkout.dataset.control==='yes';
 let documents=[],pending;
 bind('prepare-checkout',async()=>{
  const result=await api(control?'control-documents':'checkout-documents');
  documents=result.documents.map(({id,version})=>({id,version}));
  const names={buyers:'Сведения об обработке данных покупателей',privacy:'Политика обработки персональных данных',terms:'Пользовательское соглашение'};
  const links=result.documents.map(({id,href})=>{
   const item=document.createElement('li');
   const url=new URL(href,location.origin);
   if(url.origin!==location.origin) throw Error('Проверьте адрес документа');
   const link=document.createElement('a');
   link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=names[id];
   item.append(link);return item;
  });
  $('test-documents').replaceChildren(...links);
  $('test-price').textContent=new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB'}).format(result.amountKopecks/100);
  checkout.hidden=false;
  $('prepare-checkout').hidden=true;
  message('');
 });
 form('test-checkout',async data=>{
  const payload={...data,paymentMethod:'bank_card',consentDocuments:documents};
  const signature=JSON.stringify(payload);
  if(!pending || pending.signature!==signature) pending={signature,key:key()};
  const order=await api(control?'control-order':'orders',{...payload,requestKey:pending.key});
  if(['expired','canceled'].includes(order.status) || (control && order.status==='paid')) pending=null;
  const currentFields=new FormData(checkout);
  if(Object.entries(data).some(([name,value])=>currentFields.get(name)!==value)) return;
  if(order.confirmationUrl) location.assign(order.confirmationUrl);
  else location.assign('index.php?r=return#'+order.accessToken);
 });
}
async function init(){
 if(page==='return'||(page==='ticket'&&orderToken)){
  bind('refresh',()=>{checksRemaining=maxStatusRetries;return status();});
  bind('new-order',clearPurchaseKeys);
  await status();
  return;
 }
 if(page==='ticket'){const v=await api('ticket-data',{token:token()});$('number').textContent=v.number;$('ticket-price').textContent=v.price;$('control-ticket').hidden=!v.control;$('ticket-order').textContent='Заказ '+v.orderId;$('qr').src=v.qr;$('ticket-status').textContent=labels[v.status]||v.status;$('support').textContent='Поддержка: '+v.support;$('ticket').hidden=false;const fitAge=()=>{const ticket=$('ticket'),age=$('ticket-age');const {width,height}=ticket.getBoundingClientRect();const target=Math.ceil(Math.sqrt(width*height*0.052));if(Math.abs(age.offsetWidth-target)>1) age.style.setProperty('--age-size',target+'px');};fitAge();if(typeof ResizeObserver==='function')new ResizeObserver(fitAge).observe($('ticket'));bind('print',()=>window.print());return;}
 csrf=(await api('session')).csrf;
 try{await staff();}catch{ /* show login */ }
 form('login',async d=>{const v=await api('login',d);csrf=v.csrf;$('login').reset();await staff();message('Вход выполнен');});
 form('check',check);
 $('token').addEventListener('input',()=>{checked='';$('admit').disabled=true;});
 bind('admit',async()=>{const code=checked;checked='';$('admit').disabled=true;if(!code)return;try{const v=await api('admit',{token:code});$('check-result').textContent=labels[v.status];}catch(e){$('check-result').textContent=errorLabels[e.message]||e.message;}});
 bind('camera',async()=>{cameraControl?.stop();if(!window.ZXingBrowser)throw Error('Сканер не установлен; используйте ручной ввод кода');const reader=new ZXingBrowser.BrowserQRCodeReader();cameraControl=await reader.decodeFromVideoDevice(undefined,$('video'),async(result)=>{if(result){$('token').value=result.getText();cameraControl?.stop();try{await check();}catch(e){message(e.message);}}});});
 bind('logout',async()=>{cameraControl?.stop();await api('logout');location.reload();});
 bind('dashboard',dashboard);
 setupTestCheckout();
 form('application-detail',async d=>{const v=await api('application-detail',d);$('application-data').textContent=JSON.stringify(v,null,2);});
 form('resend',async d=>{await api('resend',d);message('Повторная отправка поставлена в очередь');});
 form('mail-retry',async d=>{await api('mail-retry',{id:Number(d.id)});message('Повторная попытка поставлена в очередь');});
 form('refund',async d=>{const money=s=>{if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('Некорректная сумма');const [r,k='']=s.split('.');return Number(r)*100+Number(k.padEnd(2,'0'));};const payload={orderId:d.orderId,amountKopecks:money(d.amount),confirmAmountKopecks:money(d.confirm)};const signature=JSON.stringify(payload);if(!refundRequest||refundRequest.signature!==signature)refundRequest={signature,key:key()};const v=await api('refund',{...payload,requestKey:refundRequest.key});message('Возврат: '+v.status);});
}
init().catch(e=>message(e.message));
