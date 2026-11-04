// Optional development-only browser checks. No browser dependency is shipped.
// PLAYWRIGHT_MODULE / CHROMIUM_PATH select an existing installation.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
const { chromium }=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('dist'),output=process.env.SCREENSHOT_DIR;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain'};
const server=createServer(async(req,res)=>{
  try {
    let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(path!==root&&!path.startsWith(root+'/'))throw Error('path');
    if((await stat(path)).isDirectory())path=join(path,'index.html');
    res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(await readFile(path));
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
const errors=[];
async function monitor(context){context.on('page',page=>{
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(origin))errors.push(`${response.status()} ${response.url()}`);});
});}
async function shot(page,name){if(output){await mkdir(output,{recursive:true});await page.screenshot({path:join(output,name+'.jpg'),type:'jpeg',quality:85,fullPage:true});}}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');}
try {
  for(const [width,height] of [[1440,1000],[390,844],[320,568],[844,390],[768,1024]]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:width<900});await monitor(context);
    const page=await context.newPage();await page.goto(origin+'/');await page.locator('.instrument-card').last().waitFor();await noOverflow(page);
    assert.equal(await page.locator('.instrument-card').count(),3);
    assert.equal(await page.locator('.story-card').count(),2);
    const cards=await page.locator('.instrument-card').evaluateAll(items=>items.map(i=>({x:i.getBoundingClientRect().x,y:i.getBoundingClientRect().y})));
    if(width<=760)assert.ok(cards[1].y>cards[0].y&&cards[1].x===cards[0].x,'phone uses one column');
    else assert.equal(cards[1].y,cards[0].y,'desktop uses equal columns');
    for(const selector of ['.play-link','.read-link','.related-note','.site-header .brand','.site-header nav a','summary'])for(const box of await page.locator(selector).evaluateAll(items=>items.map(i=>({h:i.getBoundingClientRect().height}))))assert.ok(box.h>=44,selector+' target height');
    if(width===1440||width===390)await shot(page,`homepage-${width===1440?'desktop':'phone'}`);
    await page.getByRole('link',{name:'Journal',exact:true}).click();await page.waitForURL('**/journal/');await noOverflow(page);
    assert.equal(await page.locator('nav [aria-current=page]').textContent(),'Journal');
    assert.equal(await page.locator('.story-card').count(),2);
    if(width===1440||width===390)await shot(page,`journal-${width===1440?'desktop':'phone'}`);
    await page.getByRole('link',{name:'Read & play The Sound That Was Still There'}).click();await page.locator('#run:enabled').waitFor();
    await page.locator('header .brand').click();await page.waitForURL('**/journal/');
    await page.getByRole('link',{name:'Read & play The Ring That Will Not Close'}).click();await page.locator('#run:enabled').waitFor();
    await page.locator('header .brand').click();await page.waitForURL('**/journal/');
    await context.close();console.log(`PASS collection layouts and story navigation ${width}×${height}`);
  }
  const context=await browser.newContext({reducedMotion:'reduce'});await monitor(context);
  const page=await context.newPage();await page.goto(origin+'/');
  await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Skip to the instruments');
  await page.keyboard.press('Enter');assert.equal(await page.locator(':focus').getAttribute('id'),'main');
  await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Explore chemistry ↗');
  assert.equal(await page.locator('.instrument-preview svg').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  await page.keyboard.press('Enter');await page.locator('#element-H').waitFor();
  await page.getByRole('link',{name:'Workbench',exact:true}).click();await page.locator('#palette-H').waitFor();
  await page.goBack();await page.locator('#element-H').waitFor();assert.equal(new URL(page.url()).hash,'');
  await page.goBack();await page.locator('.instrument-card').last().waitFor();
  await page.goForward();await page.locator('#element-H').waitFor();
  await page.getByRole('link',{name:'Instruments',exact:true}).click();await page.waitForURL(origin+'/');
  for(const route of ['table','workbench','everyday','trails','collection']) {
    await page.goto(origin+'/?legacy=1#'+route);await page.waitForURL(origin+'/chemistry/?legacy=1#'+route);
    assert.equal(await page.locator(`[data-nav="${route}"]`).getAttribute('aria-current'),'page');
  }
  await page.goto(origin+'/');await page.goto(origin+'/?old=1#collection');await page.waitForURL('**/chemistry/?old=1#collection');
  await page.goBack();await page.waitForURL(origin+'/');
  await page.goto(origin+'/instruments/?bookmark=1#instruments');await page.waitForURL(origin+'/?bookmark=1#instruments');
  await context.close();console.log('PASS legacy URLs, replacement history, back/forward, skip link, keyboard launch, reduced motion');
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});await monitor(noJS);
  const staticPage=await noJS.newPage();
  for(const path of ['/','/journal/']){await staticPage.goto(origin+path);assert.equal(await staticPage.locator('.story-card').count(),2);await noOverflow(staticPage);}
  await staticPage.goto(origin+'/instruments/');await staticPage.getByRole('link',{name:'Open Instruments'}).click();await staticPage.waitForURL(origin+'/');
  await noJS.close();assert.deepEqual(errors,[]);console.log('PASS no-JavaScript browsing; no exceptions or failed local assets');
}finally{await browser.close();server.close();}
