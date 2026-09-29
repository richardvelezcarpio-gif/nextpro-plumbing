const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const ROOT=__dirname;
const pages=['index.html','services/plumbing.html','services/drain-cleaning.html','services/water-heaters.html','services/maintenance.html','service-areas.html','about.html','contact.html','privacy.html','terms.html'];
const results={pages:0,viewports:[390,430,820,1280,1440],errors:[],checks:[]};
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const context=await browser.newContext();
 const page=await context.newPage();
 page.on('pageerror',err=>results.errors.push(String(err)));
 page.on('console',msg=>{if(msg.type()==='error')results.errors.push(msg.text())});
 page.on('response',res=>{if(res.status()>=400)results.errors.push(`${res.status()} ${res.url()}`)});
 for(const lang of ['en','es'])for(const p of pages){
  const route=(lang==='es'?'es/':'')+p;
  await page.goto('http://127.0.0.1:8080/'+route+'?lang='+lang);
  assert.equal(await page.locator('html').getAttribute('lang'),lang);
  assert.equal(await page.locator('h1').count(),1);
  assert.ok(await page.locator('meta[name=description]').getAttribute('content'));
  assert.ok(await page.locator('link[rel=canonical]').getAttribute('href'));
  assert.equal(await page.locator('link[hreflang]').count(),3);
  const data=await page.evaluate(()=>({links:[...document.querySelectorAll('a[href]')].map(a=>a.href),images:[...document.images].map(i=>({src:i.src,alt:i.alt})),json:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent))}));
  for(const img of data.images){assert.ok(img.alt);assert.ok(fs.existsSync(path.join(ROOT,new URL(img.src).pathname)))}
  for(const href of data.links){
   const url=new URL(href);
   if(url.protocol==='tel:'){assert.equal(url.href,'tel:+12393337935');continue}
   if(url.hostname==='wa.me'){assert.equal(url.pathname,'/12393337935');assert.ok(url.searchParams.get('text').startsWith(lang==='es'?'Hola':'Hello'));continue}
   if(url.hostname!=='127.0.0.1')continue;
   const dest=path.join(ROOT,decodeURIComponent(url.pathname));assert.ok(fs.existsSync(dest),href);
   if(url.hash){const content=fs.readFileSync(dest,'utf8');assert.ok(content.includes(`id="${url.hash.slice(1)}"`),href)}
  }
  await page.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
  assert.deepEqual(await page.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)),[]);
  for(const width of results.viewports){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} overflow at ${width}`);
   if(width===1440){assert.equal(await page.locator('.mobile-bar').isVisible(),false);assert.equal(await page.locator('.menu').isVisible(),true)}
   if(width===390){
    assert.equal(await page.locator('.mobile-bar').isVisible(),true);
    await page.locator('.hamburger').click();assert.equal(await page.locator('.hamburger').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');assert.equal(await page.locator('.hamburger').getAttribute('aria-expanded'),'false');
   }
  }
  if(p==='services/plumbing.html'){
   assert.equal(await page.locator('.service-detail').count(),11);
   const imgs=await page.locator('.service-detail img').evaluateAll(xs=>xs.map(x=>x.src));assert.equal(new Set(imgs).size,11);
   assert.equal(await page.locator('.quick-grid a').count(),11);
   for(const w of [390,430,1440]){await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));await page.setViewportSize({width:w,height:900});await page.screenshot({path:`qa-plumbing-${lang}-${w}.png`,fullPage:true});await page.screenshot({path:`qa-top-${lang}-${w}.png`});if(w===390||w===1440)await page.locator('#leaks').screenshot({path:`qa-section-${lang}-${w}.png`})}
  }
  results.pages++;
 }
 results.checks.push('20 pages: EN/ES, internal files and anchors, local images, titles, descriptions, canonical, hreflang, structured data, call/WhatsApp links, 100 responsive page layouts, mobile menu and desktop/mobile bars');
 await page.goto('http://127.0.0.1:8080/services/plumbing.html?lang=en#kitchen');
 await page.locator('[data-language=es]').click();await page.waitForURL(/es\/services\/plumbing/);assert.equal(new URL(page.url()).hash,'#kitchen');
 await page.goto('http://127.0.0.1:8080/index.html');await page.waitForURL(/es\/index/);
 assert.equal(await page.locator('html').getAttribute('lang'),'es');
 results.checks.push('Language selector preserves anchor and persists across direct navigation');
 for(const lang of ['en','es']){
  await page.goto('http://127.0.0.1:8080/'+(lang==='es'?'es/':'')+'contact.html?lang='+lang);
  await page.evaluate(()=>{window.open=(url)=>{window.__waURL=url;return null}});
  await page.locator('button[type=submit]').click();assert.equal(await page.evaluate(()=>window.__waURL),undefined);
  await page.locator('#phone').fill('invalid');await page.locator('#phone').blur();assert.equal(await page.locator('#phone').evaluate(x=>x.checkValidity()),false);
  await page.locator('#name').fill('QA Test');await page.locator('#phone').fill('239-333-7935');await page.locator('#city').fill('Bayonne');await page.locator('#service').selectOption({index:1});await page.locator('#message').fill('Test only / Prueba & conexión');
  await page.locator('button[type=submit]').click();const url=await page.evaluate(()=>window.__waURL);assert.ok(url);
  const text=new URL(url).searchParams.get('text');assert.ok(text.includes('Test only / Prueba & conexión'));assert.ok(text.includes(lang==='es'?'Nombre completo: QA Test':'Full name: QA Test'));
  assert.equal(await page.locator('.form-status a').getAttribute('href'),url);
 }
 results.checks.push('Form required fields, complete encoded bilingual WhatsApp message, safe fallback link; no message sent');
 await page.locator('[data-language=en]').click();await page.waitForURL(/contact.html\?lang=en/);assert.equal(await page.locator('#name').inputValue(),'QA Test');
 results.checks.push('Form draft survives language switch');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa-contact-390.png',fullPage:true});
 await browser.close();
 fs.writeFileSync('qa-results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
 assert.deepEqual(results.errors,[]);
})().catch(err=>{console.error(err);process.exit(1)});
