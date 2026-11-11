'use strict';
const $=id=>document.getElementById(id), page=document.body.dataset.page;
let csrf='',checked='',cameraControl=null,refundRequest=null;
const errorLabels={ticket_not_found:'Билет не найден',invalid_ticket:'Билет недействителен',used:'Уже использован',login_required:'Войдите в кабинет',invalid_login:'Неверный логин или пароль',csrf_required:'Сессия изменилась — обновите страницу',partial_refunds_not_approved:'Частичные возвраты пока не согласованы',rate_limited:'Слишком много запросов — повторите позже'};
const message=text=>{$('message').textContent=errorLabels[text]||text;};
const labels={valid:'Действителен',used:'Уже использован',refunded:'Возвращён / недействителен',refund_pending:'Возврат обрабатывается: проход заблокирован',admitted:'Проход подтверждён',reserved:'Ожидает оплаты',paid:'Оплачен',canceled:'Платёж отменён',expired:'Срок брони истёк. Оформите новый заказ.'};
async function api(route,data={}){const res=await fetch('index.php?r='+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,csrf}),credentials:'same-origin'});const v=await res.json();if(!res.ok)throw Error(v.error||'Ошибка сервера');return v;}
const token=()=>location.hash.slice(1);
const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
function bind(id,fn){$(id)?.addEventListener('click',()=>Promise.resolve().then(fn).catch(e=>message(e.message)));}
function form(id,fn){$(id)?.addEventListener('submit',e=>{e.preventDefault();const el=e.currentTarget;const data=Object.fromEntries(new FormData(el));const button=el.querySelector('button');button.disabled=true;Promise.resolve().then(()=>fn(data)).catch(e=>message(e.message)).finally(()=>{button.disabled=false;});});}
async function status(){
 const v=await api('order-status',{token:token()});
 message(v.status==='reserved'&&v.paymentStatus==='waiting_for_capture'?'Подтверждаем оплату…':labels[v.status]||v.status);
 if(['paid','canceled','refunded','expired'].includes(v.status)){
  $('new-order').hidden=false;
  $('new-order').onclick=()=>{try{sessionStorage.removeItem('status-request-purchase');}catch{}};
 }
 for(const [id,url] of [['open-ticket',v.ticketUrl],['pay',v.confirmationUrl]]){
  $(id).hidden=!url;
  if(url) $(id).href=url;
 }
}
async function check(){checked='';$('admit').disabled=true;const v=await api('check',{token:$('token').value.trim()});$('check-result').textContent=v.number+' · '+(labels[v.status]||v.status);if(v.status==='valid'){checked=$('token').value.trim();$('admit').disabled=false;}}
async function staff(){const s=await api('me');$('login').hidden=true;$('staff').hidden=false;$('admin').hidden=s.role!=='admin';}
async function dashboard(){const d=await api('dashboard');$('lists').replaceChildren();for(const [name,rows] of Object.entries(d)){const title=document.createElement('h3');title.textContent=name;const table=document.createElement('table');if(rows.length){const tr=document.createElement('tr');for(const k of Object.keys(rows[0])){const th=document.createElement('th');th.textContent=k;tr.append(th);}table.append(tr);}for(const row of rows){const tr=document.createElement('tr');for(const v of Object.values(row)){const td=document.createElement('td');td.textContent=v??'';tr.append(td);}table.append(tr);}$('lists').append(title,table);}}
async function init(){
 if(page==='ticket'){const v=await api('ticket-data',{token:token()});$('number').textContent=v.number;$('qr').src=v.qr;$('ticket-status').textContent=labels[v.status]||v.status;$('support').textContent='Поддержка: '+v.support;$('ticket').hidden=false;bind('print',()=>window.print());return;}
 if(page==='return'){bind('refresh',status);await status();return;}
 csrf=(await api('session')).csrf;
 try{await staff();}catch{ /* show login */ }
 form('login',async d=>{const v=await api('login',d);csrf=v.csrf;$('login').reset();await staff();message('Вход выполнен');});
 form('check',check);
 $('token').addEventListener('input',()=>{checked='';$('admit').disabled=true;});
 bind('admit',async()=>{const code=checked;checked='';$('admit').disabled=true;if(!code)return;try{const v=await api('admit',{token:code});$('check-result').textContent=labels[v.status];}catch(e){$('check-result').textContent=errorLabels[e.message]||e.message;}});
 bind('camera',async()=>{cameraControl?.stop();if(!window.ZXingBrowser)throw Error('Сканер не установлен; используйте ручной ввод кода');const reader=new ZXingBrowser.BrowserQRCodeReader();cameraControl=await reader.decodeFromVideoDevice(undefined,$('video'),async(result)=>{if(result){$('token').value=result.getText();cameraControl?.stop();try{await check();}catch(e){message(e.message);}}});});
 bind('logout',async()=>{cameraControl?.stop();await api('logout');location.reload();});
 bind('dashboard',dashboard);
 form('application-detail',async d=>{const v=await api('application-detail',d);$('application-data').textContent=JSON.stringify(v,null,2);});
 form('resend',async d=>{await api('resend',d);message('Повторная отправка поставлена в очередь');});
 form('mail-retry',async d=>{await api('mail-retry',{id:Number(d.id)});message('Повторная попытка поставлена в очередь');});
 form('refund',async d=>{const money=s=>{if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('Некорректная сумма');const [r,k='']=s.split('.');return Number(r)*100+Number(k.padEnd(2,'0'));};const payload={orderId:d.orderId,amountKopecks:money(d.amount),confirmAmountKopecks:money(d.confirm)};const signature=JSON.stringify(payload);if(!refundRequest||refundRequest.signature!==signature)refundRequest={signature,key:key()};const v=await api('refund',{...payload,requestKey:refundRequest.key});message('Возврат: '+v.status);});
}
init().catch(e=>message(e.message));
