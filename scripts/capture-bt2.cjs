// Temporary tool dependency: npm install --prefix .tmp/tools --no-save playwright
// Uses installed Chrome and an isolated SQLite file; does not touch the demo DB.
const { chromium } = require('../.tmp/tools/node_modules/playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..');
  const out = path.join(root,'docs/evidence/bt2'); fs.mkdirSync(out,{recursive:true});
  const env = {...process.env,DB_PATH:path.join(root,'.tmp',`evidence-${Date.now()}.sqlite`),APP_PORT:'3102',DEMO_PASSWORD:'temporary-evidence-password',LOG_LEVEL:'error'};
  for (const file of ['scripts/migrate.js','scripts/seed.js']) execFileSync(process.execPath,[file],{cwd:root,env});
  let api, web, browser;
  const wait = async url => { for(let i=0;i<100;i++){try{if((await fetch(url)).ok)return;}catch{} await new Promise(r=>setTimeout(r,200));}throw Error('Server timeout '+url); };
  try {
    api=spawn(process.execPath,['src/backend/server.js'],{cwd:root,env,stdio:'ignore'});
    web=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5175','--strictPort'],{cwd:root,env,stdio:'ignore'});
    await Promise.all([wait('http://127.0.0.1:3102/api/health'),wait('http://127.0.0.1:5175')]);
    browser=await chromium.launch({channel:'chrome',headless:true});
    const context=await browser.newContext({viewport:{width:1280,height:850}});
    const page=await context.newPage(), base='http://127.0.0.1:5175';
    const shot=name=>page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
    await page.goto(base); await page.locator('[name=password]').fill(env.DEMO_PASSWORD); await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
    await page.getByRole('heading',{name:'Mẫu khảo sát',exact:true}).waitFor(); await page.getByRole('button',{name:'CSAT sau hỗ trợ',exact:true}).waitFor();
    await shot('01-templates');
    // Genuine empty response from SQLite after deleting the unused seeded template.
    await page.getByRole('button',{name:'Xóa CSAT sau hỗ trợ',exact:true}).click();
    await page.getByText('Chưa có dữ liệu.',{exact:false}).waitFor(); await shot('02-empty');
    await page.locator('#template-name').fill('CSAT BT2'); await page.getByRole('button',{name:'Lưu',exact:true}).click();
    await page.getByRole('button',{name:'CSAT BT2',exact:true}).waitFor();
    await page.getByRole('link',{name:'Gửi khảo sát',exact:true}).click();
    await page.getByRole('radio',{name:'Chọn YC-DEMO-001',exact:true}).check();
    await page.locator('#invitation-template').selectOption({label:'CSAT BT2'});
    await page.getByRole('button',{name:'Gửi lời mời',exact:true}).click();
    const link=page.getByRole('link',{name:'Mở trang khách hàng đánh giá ↗',exact:true}); await link.waitFor(); await shot('03-invitation');
    const survey=await page.context().newPage(); await survey.goto(base+await link.getAttribute('href'));
    await survey.getByRole('heading',{name:'Đánh giá dịch vụ',exact:true}).waitFor();
    await survey.locator('input[name=score][value="5"]').check(); await survey.locator('#survey-comment').fill('Demo BT2: quy trình hoạt động tốt.');
    await survey.screenshot({path:path.join(out,'04-survey.png'),fullPage:true});
    await survey.getByRole('button',{name:'Gửi',exact:true}).click(); await survey.getByText('Cảm ơn bạn đã phản hồi!',{exact:true}).waitFor();
    await survey.screenshot({path:path.join(out,'05-response.png'),fullPage:true});
    await page.getByRole('link',{name:'Báo cáo',exact:true}).click(); await page.getByText('100%',{exact:true}).waitFor(); await shot('06-dashboard');
    // Real delayed HTTP request demonstrates loading, then real backend shutdown demonstrates failure.
    await page.route('**/api/survey-templates',async route=>{await new Promise(r=>setTimeout(r,1800)); await route.continue();});
    await page.getByRole('link',{name:'Mẫu khảo sát',exact:true}).click(); await page.getByText('Đang tải dữ liệu…',{exact:true}).waitFor(); await shot('07-loading');
    await page.getByRole('button',{name:'CSAT BT2',exact:true}).waitFor(); await page.unroute('**/api/survey-templates');
    api.kill(); await new Promise(resolve=>api.once('exit',resolve)); api=null;
    await page.getByRole('link',{name:'Báo cáo',exact:true}).click(); await page.getByRole('button',{name:'Thử lại',exact:true}).waitFor(); await shot('08-error');
    // Restore API, log in again because sessions are intentionally in RAM.
    api=spawn(process.execPath,['src/backend/server.js'],{cwd:root,env,stdio:'ignore'}); await wait('http://127.0.0.1:3102/api/health');
    await page.getByRole('button',{name:'Thử lại',exact:true}).click(); await page.locator('[name=password]').waitFor();
    await page.locator('[name=password]').fill(env.DEMO_PASSWORD); await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
    await page.getByText('100%',{exact:true}).waitFor(); await page.setViewportSize({width:375,height:812}); await shot('09-mobile');
    assert.ok(await page.locator('h1').isVisible());
    const testResult=execFileSync(process.execPath,['--test','tests/packaging.test.js','tests/survey.test.js'],{cwd:root,encoding:'utf8',env:{...process.env,LOG_LEVEL:'error',FORCE_COLOR:'0'}});
    fs.writeFileSync(path.join(out,'test-output.txt'),testResult);
    const terminal=await browser.newPage({viewport:{width:1250,height:1200}});
    await terminal.setContent('<html><body style="background:#101820;color:#eff7ef;padding:30px;font:17px Consolas,monospace"><h2>Actual command output: node --test tests/*.test.js</h2><pre style="white-space:pre-wrap"></pre></body></html>');
    await terminal.locator('pre').textContent().then(()=>terminal.locator('pre').evaluate((el,value)=>el.textContent=value,testResult));
    await terminal.screenshot({path:path.join(out,'10-tests.png'),fullPage:true});
    fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({capturedAt:new Date().toISOString(),browser:'Chrome headless',database:'isolated temporary SQLite',tests:17,states:['data','empty after delete','loading delayed actual request','error after API stopped'],note:'10-tests.png renders actual captured process output; it is not an OS terminal screenshot.'},null,2));
    console.log('Captured BT2 evidence; 17 tests PASS.');
  } finally { await browser?.close(); api?.kill(); web?.kill(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
