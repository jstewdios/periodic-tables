// Optional development check. Install Playwright separately; no browser package
// is shipped to visitors. See docs/INSTRUMENTS.md for invocation and limits.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=resolve('dist'), output=process.env.SCREENSHOT_DIR;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain'};
const server=createServer(async(req,res)=>{
  try {
    let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(path!==root&&!path.startsWith(root+'/'))throw Error('path');
    if((await stat(path)).isDirectory())path=join(path,'index.html');
    res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(await readFile(path));
  } catch {res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
const errors=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(check,message) {
  for(let i=0;i<60;i++){if(await check())return;await pause(50);}
  throw Error(message);
}
async function screenshot(page,name){if(output){await mkdir(output,{recursive:true});await page.screenshot({path:join(output,name+'.png'),fullPage:true});}}
async function monitor(context) {
  // Observe real browser audio contexts without altering playback decisions.
  await context.addInitScript(()=>{
    window.testContexts=[];
    const Native=window.AudioContext;
    window.AudioContext=class extends Native {
      constructor(...args){super(...args);window.testContexts.push(this);}
      close(){localStorage.setItem('test-closed-contexts',String(Number(localStorage.getItem('test-closed-contexts')||0)+1));return super.close();}
    };
  });
  context.on('page',page=>{
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  });
}
async function center(page,selector){const b=await page.locator(selector).boundingBox();assert.ok(b,selector);return{x:b.x+b.width/2,y:b.y+b.height/2};}
async function tapPocket(page,index){const p=await center(page,`[data-pocket="${index}"]`);await page.touchscreen.tap(p.x,p.y);}
async function gesture(session,type,points){await session.send('Input.dispatchTouchEvent',{type,touchPoints:points});}
const touch=(id,p)=>({id,x:p.x,y:p.y,radiusX:7,radiusY:7,force:1});
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');}

try {
  const desktop=await browser.newContext({viewport:{width:1440,height:1000}});await monitor(desktop);
  const page=await desktop.newPage();await page.goto(origin+'/#table');
  assert.equal(await page.locator('.element-tile').count(),118);
  await page.locator('#element-H').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator(':focus').getAttribute('id'),'element-He');
  await page.locator('[data-nav="workbench"]').click();
  await page.locator('#palette-H').click();await page.locator('#palette-H').click();
  await page.locator('#palette-O').click();
  await page.locator('[data-action="keep-compound"][data-id="water"]').click();
  await page.locator('[data-nav="collection"]').click();await page.locator('.discovery-card').waitFor();assert.match(await page.locator('#main').textContent(),/Water/);
  await page.locator('[data-nav="trails"]').click();await page.locator('.trail-card').first().waitFor();assert.equal(await page.locator('.trail-card').count(),4);
  await page.locator('[data-action="start-trail"][data-id="family"]').click();await page.locator('.trail-banner').waitFor();
  for(const symbol of ['Li','Na','K'])await page.locator('#element-'+symbol).click();
  await page.locator('[data-action="next-trail"]').click();await page.locator('[data-action="clear-atoms"]').click();
  await page.locator('#palette-Na').click();await page.locator('#palette-Cl').click();await page.locator('[data-action="next-trail"]').click();
  await page.locator('#minus-Na').click();await page.locator('#palette-K').click();await page.locator('[data-action="next-trail"]').click();
  await page.locator('.trail-keepsake').waitFor();
  await page.locator('[data-nav="everyday"]').click();await page.locator('[data-action="object"][data-id="phone"]').click();assert.match(await page.locator('#main').textContent(),/phone/i);
  await page.locator('[data-nav="table"]').click();await page.locator('#sound-toggle').click();
  assert.equal(await page.evaluate(()=>testContexts[0].state),'running');
  await page.getByRole('link',{name:'Instruments',exact:true}).click();
  await page.locator('.instrument-card').first().waitFor();
  assert.equal(await page.locator('.instrument-card').count(),3);assert.equal(await page.evaluate(()=>localStorage.getItem('test-closed-contexts')),'1');
  await screenshot(page,'collection-desktop');await page.getByRole('link',{name:'Play Hushpod'}).click();
  await page.locator('#stage').waitFor();
  assert.equal(await page.evaluate(()=>testContexts.length),0);await screenshot(page,'hushpod-desktop');
  await page.keyboard.press('1');await waitFor(()=>page.locator('#begin').isHidden(),'keyboard audio unlock');
  await page.locator('[data-waist="0"]').focus();await page.keyboard.press('Home');assert.equal(await page.locator('[data-waist="0"]').getAttribute('aria-valuenow'),'0');
  await page.keyboard.press('End');await page.keyboard.press('m');assert.equal(await page.locator('#mute').getAttribute('aria-pressed'),'true');
  await page.getByRole('link',{name:'Chemistry'}).click();await page.locator('#element-H').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('test-closed-contexts')),'2');
  await page.goto(origin+'/#collection');assert.match(await page.locator('#main').textContent(),/Water/);
  await desktop.close();console.log('PASS desktop: chemistry, saves, trails, navigation, keyboard, audio cleanup');

  for(const [width,height] of [[390,844],[320,568],[844,390]]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2});await monitor(context);
    const phone=await context.newPage();await phone.goto(origin+'/instruments/');await noOverflow(phone);await screenshot(phone,`collection-${width}`);
    await phone.getByRole('link',{name:'Play Hushpod'}).tap();await phone.locator('#stage').waitFor();await noOverflow(phone);
    assert.equal(await phone.evaluate(()=>testContexts.length),0);
    for(const selector of ['#begin','#reset','#help-open','#inspect-toggle']) {
      const box=await phone.locator(selector).boundingBox();assert.ok(box.width>=44&&box.height>=44,selector+' touch target');assert.ok(box.y+box.height<=height+1,selector+' within viewport');
    }
    await screenshot(phone,`hushpod-${width}`);
    await tapPocket(phone,0);await waitFor(()=>phone.locator('#begin').isHidden(),'touch audio unlock');
    await phone.locator('#inspect-toggle').tap();await waitFor(async()=>Number(await phone.locator('#read-n').textContent())>0,'real worklet output');await phone.locator('#inspect-close').tap();
    const session=await context.newCDPSession(phone),p=await center(phone,'[data-pocket="0"]'),w=await center(phone,'[data-waist="0"]');
    const vertical=await phone.locator('[data-waist="0"]').getAttribute('aria-orientation')==='horizontal';
    const moved=vertical?{x:w.x-60,y:w.y}:{x:w.x,y:w.y+60};
    await gesture(session,'touchStart',[touch(1,p),touch(2,w)]);
    await gesture(session,'touchMove',[touch(1,{x:p.x+12,y:p.y}),touch(2,moved)]);
    await gesture(session,'touchEnd',[]);
    assert.ok(Number(await phone.locator('[data-waist="0"]').getAttribute('aria-valuenow'))<100,'two-finger waist drag');
    assert.equal(await phone.evaluate(()=>scrollY),0,'playing does not scroll');
    await gesture(session,'touchStart',[touch(1,p)]);await gesture(session,'touchCancel',[]);
    await phone.setViewportSize({width:height,height:width});await noOverflow(phone);await tapPocket(phone,2);
    // Synthetic lifecycle events cover our handlers; this is not a device sleep test.
    await phone.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    await waitFor(()=>phone.evaluate(()=>testContexts[0].state==='suspended'),'background pause');
    await phone.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal(await phone.evaluate(()=>testContexts[0].state),'suspended');
    await phone.locator('#begin').tap();await waitFor(()=>phone.locator('#begin').isHidden(),'explicit resume');
    await phone.locator('#mute').tap();assert.equal(await phone.locator('#mute').getAttribute('aria-pressed'),'true');
    await phone.getByRole('link',{name:'Instruments'}).tap();await phone.locator('.instrument-card').first().waitFor();assert.equal(await phone.evaluate(()=>localStorage.getItem('test-closed-contexts')),'1');
    await phone.goBack();assert.equal(await phone.locator('#begin').isVisible(),true);await tapPocket(phone,0);await waitFor(()=>phone.locator('#begin').isHidden(),'back navigation audio unlock');
    await phone.reload();assert.equal(await phone.locator('#begin').isVisible(),true);assert.equal(await phone.evaluate(()=>testContexts.length),0);
    await context.close();console.log(`PASS touch ${width}×${height}: real worklet, multitouch, cancellation, rotate, pause/resume, navigation`);
  }
  // Odd Sympathy: opt-in sound, keyboard play, drawer, touch creation, background pause and navigation cleanup.
  for(const [width,height,touchDevice] of [[1440,1000,false],[390,844,true],[844,390,true]]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:touchDevice,hasTouch:touchDevice,deviceScaleFactor:touchDevice?2:1});await monitor(context);
    const page=await context.newPage();await page.goto(origin+'/instruments/odd-sympathy/');await page.locator('#begin').waitFor();await noOverflow(page);
    assert.equal(await page.evaluate(()=>testContexts.length),0,'silent before a gesture');
    for(const selector of ['#begin','#sound-btn','#tune-btn']){const box=await page.locator(selector).boundingBox();assert.ok(box.width>=44&&box.height>=44,selector+' touch target');}
    await screenshot(page,`odd-sympathy-intro-${width}`);
    if(touchDevice)await page.locator('#begin').tap();else await page.locator('#begin').click();
    await waitFor(()=>page.locator('#intro').isHidden(),'intro dismissed');
    await waitFor(()=>page.evaluate(()=>testContexts[0]?.state==='running'),'sound running');
    assert.equal(await page.locator('.ring-target').count(),1);
    if(touchDevice){const b=await page.locator('#field').boundingBox();await page.touchscreen.tap(b.x+b.width*.25,b.y+b.height*.7);}
    else await page.keyboard.press('n');
    await waitFor(async()=>await page.locator('.ring-target').count()===2,'second ring');
    await page.locator('.ring-target').first().focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');
    await page.keyboard.press('m');assert.equal(await page.locator('#sound-btn').getAttribute('aria-label'),'Unmute sound');await page.keyboard.press('m');
    await page.keyboard.press('t');await page.locator('#drawer').waitFor();await page.locator('[data-setup="trading"]').click();
    assert.equal(await page.locator('#drawer').isHidden(),true);assert.equal(await page.locator('.ring-target').count(),2);
    await pause(400);await screenshot(page,`odd-sympathy-${width}`);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    await waitFor(()=>page.evaluate(()=>testContexts[0].state==='suspended'),'background pause');
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal(await page.evaluate(()=>testContexts[0].state),'suspended','no automatic resume');
    await page.locator('#sound-btn').click();await waitFor(()=>page.evaluate(()=>testContexts[0].state==='running'),'explicit resume');
    await page.getByRole('link',{name:'← Instruments'}).click();await page.locator('.instrument-card').first().waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('test-closed-contexts')),'1');
    await page.goBack();await page.locator('#field').waitFor();assert.equal(await page.evaluate(()=>testContexts.filter(c=>c.state==='running').length),0,'silent on return');
    await context.close();console.log(`PASS Odd Sympathy ${width}×${height}`);
  }
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await monitor(context);
  const page2=await context.newPage();await page2.goto(origin+'/instruments/hushpod/');await page2.locator('#begin').click();await waitFor(()=>page2.locator('#begin').isHidden(),'reduced motion sound');await screenshot(page2,'hushpod-reduced-motion');
  await page2.goto(origin+'/instruments/odd-sympathy/');await page2.locator('#begin').click();await waitFor(()=>page2.locator('#intro').isHidden(),'reduced motion odd sympathy');await pause(600);await screenshot(page2,'odd-sympathy-reduced-motion');await context.close();
  assert.deepEqual(errors,[]);console.log('PASS reduced motion and no browser exceptions or failed asset requests');
} finally {await browser.close();server.close();}
