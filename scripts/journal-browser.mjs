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
 for(const [width,height,reduce] of [[1440,1000,false],[390,844,false],[320,568,false],[844,390,false],[390,844,true]]) {
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<900,isMobile:width<900,reducedMotion:reduce?'reduce':'no-preference'});await monitor(context);
  const page=await context.newPage();await page.goto(origin+'/journal/hushpod/');
  await page.locator('#run:enabled').waitFor();await noOverflow(page);
  assert.equal(await page.evaluate(()=>testContexts.length),0,'no audio context before opt-in');
  assert.equal(await page.locator('#action').textContent(),'0.5000');assert.equal(await page.locator('#pickup').textContent(),'0.0000');
  await screenshot(page,`journal-${width}${reduce?'-reduced':''}`);
  await page.locator('#phase').focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('#phase-value').textContent(),'0°');assert.equal(await page.locator('#action').textContent(),'0.5000');assert.equal(await page.locator('#pickup').textContent(),'1.0000');
  await page.keyboard.press('End');assert.equal(await page.locator('#pickup').textContent(),'0.0000');
  await page.locator('#run').click();await waitFor(async()=>Number(await page.locator('#action').textContent())<.49,'silent simulation evolves');
  assert.equal(await page.locator('#pickup').textContent(),'0.0000');
  await page.locator('#reveal').click();await waitFor(async()=>Number(await page.locator('#pickup').textContent())>.005,'waist reveals signal');
  await page.locator('#run').click();const paused=await page.locator('#clock').textContent();await pause(150);assert.equal(await page.locator('#clock').textContent(),paused,'pause freezes simulation');
  await page.locator('#sound').click();await waitFor(()=>page.evaluate(()=>testContexts[0]?.state==='running'),'real audio opt-in');
  await page.locator('#run').click();await waitFor(async()=>await page.locator('#clock').textContent()!==paused,'audio authority evolves measurements');
  await page.locator('#reset').click();await waitFor(async()=>await page.locator('#action').textContent()==='0.5000','audio reset');
  await page.locator('#run').click();await pause(150);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await waitFor(()=>page.evaluate(()=>testContexts[0].state==='closed'),'background closes sound');
  assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.locator('#run').textContent(),'Start experiment');
  await page.locator('#sound').click();await waitFor(()=>page.evaluate(()=>testContexts[1]?.state==='running'),'explicit sound restart');
  await page.getByRole('link',{name:'Play full Hushpod'}).click();await page.locator('#stage').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('test-closed-contexts')),'2','navigation closes audio');
  await context.close();console.log(`PASS journal ${width}×${height} reduced=${reduce}: phase keyboard, real model, pause, audio handoff, lifecycle, navigation`);
 }
 const context=await browser.newContext();await monitor(context);await context.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;});
 const page=await context.newPage();await page.goto(origin+'/journal/hushpod/');await page.locator('#sound').click();assert.match(await page.locator('#status').textContent(),/unavailable/);
 await page.locator('#run').click();await waitFor(async()=>Number(await page.locator('#action').textContent())<.49,'silent fallback');await context.close();
 assert.deepEqual(errors,[]);console.log('PASS no-audio fallback; no browser exceptions or failed assets');
} finally {await browser.close();server.close();}
