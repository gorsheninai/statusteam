import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const fixture=JSON.parse(readFileSync(process.env.HTTP_FIXTURE_JSON,'utf8'));
const base='http://localhost:34311/api/index.php';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let count=0;
const check=(value,label)=>{if(!value)throw Error(label);console.log('PASS '+label);count++;};
const post=async(r,d={},origin='http://localhost:34311')=>page.request.post(base+'?r='+r,{headers:{Origin:origin},data:d});
try {
 await page.goto(base+'?r=ticket#'+fixture.token);
 await page.locator('#ticket').waitFor({state:'visible'});
 check((await page.locator('#ticket-status').textContent())==='Действителен для прохода','mobile ticket renders with live admission status');
 check((await page.locator('#qr').getAttribute('src')).startsWith('data:image/svg+xml'),'QR generated locally');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile ticket has no horizontal overflow');
 await page.goto('about:blank');
 await page.goto(base+'?r=ticket#order-'+fixture.orderAccess);
 await page.waitForURL(base+'?r=ticket#'+fixture.token);
 await page.locator('#ticket').waitFor({state:'visible'});
 check(page.url()===base+'?r=ticket#'+fixture.token &&
   await page.locator('#ticket-status').textContent()==='Действителен для прохода',
   'YooKassa return renders the ticket when only the URL fragment changes');
 check((await post('admit',{token:fixture.token})).status()===403,'admit requires CSRF and authorization');
 check((await post('forms',{},'https://foreign.example')).status()===403,'foreign origin denied');
 check((await post('orders',{})).status()===503,'disabled checkout denied by server');
 const keyLookup=await post('order-status',{requestKey:fixture.requestKey});
 const keyLookupData=await keyLookup.json();
 check(keyLookup.status()===422 && !keyLookupData.accessToken && !keyLookupData.ticketUrl && !keyLookupData.confirmationUrl,
   'an order request key alone cannot reveal ticket or payment links');
 const orderLookup=await (await post('order-status',{token:fixture.orderAccess})).json();
 check(orderLookup.orderId===fixture.orderId && orderLookup.status==='paid' && !!orderLookup.ticketUrl,
   'the original order return capability still opens the paid ticket');
 check((await page.request.get(base+'?r=admit')).status()===404,'GET cannot admit');
 await page.goto(base+'?r=staff');
 await page.locator('[name=username]').fill('fixture-door');await page.locator('[name=password]').fill(fixture.controllerPassword);
 await page.locator('#login button').click();await page.locator('#staff').waitFor({state:'visible'});
 check(await page.locator('#admin').isHidden(),'controller has no admin interface');
 const csrf=await page.evaluate(()=>csrf); // lexical binding used by the staff page
 check((await post('refund',{csrf,orderId:fixture.orderId,amountKopecks:3000000,confirmAmountKopecks:3000000,requestKey:'a'.repeat(64)})).status()===403,'controller cannot request refund via API');
 const publicTicket=await (await post('ticket-data',{token:fixture.token})).json();
 await page.locator('#token').fill(publicTicket.number);await page.locator('#check button').click();await page.waitForFunction(()=>!document.getElementById('admit').disabled);
 check((await page.locator('#check-result').textContent()).includes('Действителен'),'GET ticket display did not consume ticket');
 await page.locator('#admit').click();await page.waitForFunction(()=>document.getElementById('check-result').textContent.includes('Проход подтверждён'));
 await page.locator('#check button').click();await page.waitForFunction(()=>document.getElementById('check-result').textContent.includes('Уже использован'));
 check(await page.locator('#admit').isDisabled(),'mobile second admission disabled');
 check(await page.evaluate(()=>!!window.ZXingBrowser?.BrowserQRCodeReader),'bundled camera scanner available without CDN');
 await page.locator('#logout').click();await page.locator('#login').waitFor({state:'visible'});
 await page.locator('[name=username]').fill('fixture-controller');await page.locator('[name=password]').fill(fixture.adminPassword);await page.locator('#login button').click();await page.locator('#admin').waitFor({state:'visible'});
 await page.locator('#dashboard').click();await page.locator('#lists table').first().waitFor({state:'visible'});
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile admin tables stay inside viewport');
 check(errors.length===0,'no browser runtime errors');
 console.log('HTTP TOTAL '+count+' passed');
} finally {await browser.close();}
