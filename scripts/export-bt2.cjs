const { chromium } = require('../.tmp/tools/node_modules/playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage(), name='BT2_237480201IS04_VONGTHIRATH_SITHIPHAK';
  await page.goto(pathToFileURL(path.resolve('docs',name+'.html')).href);
  await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
  await page.pdf({path:path.resolve('docs',name+'.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
  console.log('Exported docs/'+name+'.pdf');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
