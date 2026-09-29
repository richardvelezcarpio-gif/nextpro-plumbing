const {chromium}=require('playwright');const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const p=await b.newPage();
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const baseline=JSON.parse(fs.readFileSync('qa-footer-before.json'));const report={footer:{},form:[],images:[],layouts:[],errors};
 for(const lang of ['en','es']){
  await p.goto('http://127.0.0.1:8080/'+(lang==='es'?'es/':'')+'services/maintenance.html?lang='+lang);
  assert.equal(await p.locator('.maintenance-card').count(),8);assert.equal(await p.locator('.maintenance-steps article').count(),4);assert.equal(await p.locator('.audience-grid article').count(),6);
  assert.equal(await p.locator('.prevention-list>div').count(),5);assert.equal(await p.locator('.frequency-grid span').count(),4);
  assert.equal(await p.locator('#maintenance-form [name]').count(),10);
  assert.equal(await p.locator('[name=units]').getAttribute('required'),null);
  const photos=await p.locator('main img').evaluateAll(xs=>xs.map(x=>x.src));assert.equal(new Set(photos).size,photos.length);report.images.push({lang,distinct:photos.length});
  await p.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));await p.waitForFunction(()=>[...document.images].every(i=>i.complete));assert.deepEqual(await p.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)),[]);
  for(const width of [390,430,820,1280,1440]){
   await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),lang+' '+width+' overflow');
   assert.equal(await p.locator('.division-link').count(),2);assert.ok(await p.locator('.division-nav').isVisible());
   const measure=await p.locator('.footer').evaluate(el=>Math.round(el.getBoundingClientRect().height));const before=baseline[lang+'-'+width];
   if(before){const reduction=Math.round((1-measure/before)*100);report.footer[lang+'-'+width]={before,after:measure,reduction};assert.ok(reduction>=35&&reduction<=50,`Footer ${lang}-${width}: ${reduction}%`)}
   await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:`qa-building-${lang}-${width}.png`});
   if(width===390||width===1440){await p.locator('.footer').scrollIntoViewIfNeeded();await p.locator('.floating-wa').waitFor({state:'hidden'});await p.locator('.footer').screenshot({path:`qa-footer-${lang}-${width}.png`});await p.locator('#maintenance-services').screenshot({path:`qa-building-services-${lang}-${width}.png`})}
   report.layouts.push(lang+'-'+width);
  }
  await p.locator('.maintenance-hero .btn').first().click();await p.waitForFunction(()=>location.hash==='#maintenance-assessment');
  await p.evaluate(()=>{window.open=url=>{window.__maintenanceURL=url;return null}});
  await p.locator('#maintenance-form button').click();assert.equal(await p.evaluate(()=>window.__maintenanceURL),undefined);
  const fields={name:'QA Building',company:'NextPro QA Property',phone:'239-333-7935',email:'qa@example.com',address:'TEST ONLY, New Jersey',message:'Test only & prueba de mantenimiento'};
  for(const[key,value]of Object.entries(fields))await p.locator(`#maintenance-form [name=${key}]`).fill(value);
  for(const[key,value]of Object.entries({property_type:'multifamily',maintenance_type:'comprehensive',frequency:'biweekly'}))await p.locator(`[name=${key}]`).selectOption(value);
  await p.locator('[name=email]').fill('invalid');assert.equal(await p.locator('[name=email]').evaluate(x=>x.checkValidity()),false);await p.locator('[name=email]').fill(fields.email);
  await p.locator('[name=units]').fill('0');assert.equal(await p.locator('[name=units]').evaluate(x=>x.checkValidity()),false);await p.locator('[name=units]').fill('');assert.equal(await p.locator('[name=units]').evaluate(x=>x.checkValidity()),true);
  await p.locator('#maintenance-form button').click();const url=await p.evaluate(()=>window.__maintenanceURL);const message=new URL(url).searchParams.get('text');assert.ok(message.includes('qa@example.com'));assert.ok(message.includes('NextPro QA Property'));assert.ok(message.includes(lang==='es'?'Cada Dos Semanas':'Biweekly'));assert.ok(message.includes('Test only & prueba de mantenimiento'));assert.ok(!message.includes('optional'));assert.equal(new URL(url).pathname,'/12393337935');
  report.form.push(lang+': required fields, email, optional units, encoded WhatsApp contents and translated options passed; no message sent');
  await p.locator('[name=units]').fill('24');await p.locator(`[data-language=${lang==='en'?'es':'en'}]`).click();await p.waitForFunction(l=>document.documentElement.lang===l,lang==='en'?'es':'en');
  assert.equal(await p.locator('[name=company]').inputValue(),'NextPro QA Property');assert.equal(await p.locator('[name=units]').inputValue(),'24');assert.equal(await p.locator('[name=frequency]').inputValue(),'biweekly');
 }
 // Check the navigation at intermediate desktop widths after promoting the second division.
 for(const lang of ['en','es']){await p.goto('http://127.0.0.1:8080/index.html?lang='+lang);for(const width of [1201,1250,1366,1531,1600]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Header overflow ${lang} ${width}`)}}
 await p.goto('http://127.0.0.1:8080/es/index.html?lang=es');await p.setViewportSize({width:390,height:900});await p.locator('.division-cards').screenshot({path:'qa-home-divisions-390.png'});await p.goto('http://127.0.0.1:8080/es/services/maintenance.html?lang=es');await p.locator('#maintenance-form').screenshot({path:'qa-building-form-390.png'});
 fs.writeFileSync('qa-maintenance-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));assert.deepEqual(errors,[]);await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
