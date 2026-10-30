// Isolated Docker runtime verification. Never targets the default Compose project.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');
const {chromium}=require('../.tmp/tools/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const project='smartcrm-bt2-runtime-'+Date.now();
const out=path.join(root,'docs/evidence/bt2',project);
fs.mkdirSync(out,{recursive:true});
const password=randomBytes(24).toString('hex');
const env={...process.env,DEMO_PASSWORD:password,API_HOST_PORT:'13182',WEB_PORT:'18082',LOG_LEVEL:'info'};
const base='http://127.0.0.1:18082';
const results=[],http=[],commands=[];
let browser,started=false;
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({project,volume:project+'_sqlite_data',base,results,http,commands},null,2));
function docker(args){
  commands.push('docker '+args.join(' '));
  const output=execFileSync('docker',args,{cwd:root,env,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:180000});
  return output;
}
const compose=(...args)=>docker(['compose','-p',project,...args]);
const record=(step,details)=>{results.push({step,status:'PASS',details});save();};
let session;
async function api(endpoint,method='GET',body,authenticated=true){
  const response=await fetch(base+'/api'+endpoint,{method,headers:{'Content-Type':'application/json',...(authenticated&&session?{Authorization:'Bearer '+session}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();
  http.push({endpoint:endpoint.replace(/\/public\/surveys\/[^/]+/,'/public/surveys/:token'),method,status:response.status,requestId:response.headers.get('x-request-id'),body:JSON.parse(JSON.stringify(data,(key,value)=>['token','link'].includes(key)?'[test token omitted]':value))});
  save(); assert.ok(response.ok,endpoint+' HTTP '+response.status);return data;
}
async function login(){session=(await api('/auth/login','POST',{username:'demo',password},false)).token;}
async function main(){
 try {
  // No existing project, network or volume is reused.
  assert.equal(docker(['ps','-aq','--filter','label=com.docker.compose.project='+project]).trim(),'');
  assert.equal(docker(['volume','ls','-q','--filter','label=com.docker.compose.project='+project]).trim(),'');
  compose('config','--quiet');started=true;
  fs.writeFileSync(path.join(out,'compose-up.txt'),compose('up','--build','-d','--wait','--wait-timeout','90'));
  fs.writeFileSync(path.join(out,'containers.json'),compose('ps','--format','json'));
  const mount=JSON.parse(docker(['inspect',compose('ps','-q','api').trim()]))[0].Mounts.find(m=>m.Destination==='/app/data');
  assert.equal(mount.Name,project+'_sqlite_data');
  record('isolation and stack health',{volume:mount.Name,destination:mount.Destination});
  assert.equal((await api('/health','GET',null,false)).status,'ok');
  const direct=await fetch('http://127.0.0.1:13182/api/health');assert.equal(direct.status,200);
  const web=await fetch(base);assert.equal(web.status,200);assert.match(await web.text(),/<div id="root">/);
  const spa=await fetch(base+'/survey/test-route');assert.equal(spa.status,200);
  record('HTTP API, Nginx proxy and SPA fallback','direct API and web /api/health return 200');
  await login();
  const templates=await api('/survey-templates');assert.equal(templates.length,1);
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  const responsive=[];
  async function checkResponsive(target,name){
    for(const viewport of [{width:375,height:812},{width:1440,height:900}]){
      await target.setViewportSize(viewport);
      await target.screenshot({path:path.join(out,`responsive-${name}-${viewport.width}.png`),fullPage:true});
      const dimensions=await target.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
      responsive.push({page:name,...viewport,...dimensions,status:dimensions.scrollWidth===dimensions.clientWidth?'PASS':'FAIL'});
    }
    fs.writeFileSync(path.join(out,'responsive.json'),JSON.stringify(responsive,null,2));
  }
  const shot=name=>page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
  const uiLogin=async()=>{await page.locator('[name=password]').fill(password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();};
  await page.goto(base);await page.locator('[name=password]').waitFor();await checkResponsive(page,'Login');await uiLogin();
  await page.getByRole('button',{name:'CSAT sau hỗ trợ',exact:true}).waitFor();await shot('01-desktop-templates');
  await checkResponsive(page,'Templates');
  // Delete only the unused seed in this newly created test volume to prove empty state.
  await page.getByRole('button',{name:'Xóa CSAT sau hỗ trợ',exact:true}).click();
  await page.getByText('Chưa có dữ liệu.',{exact:false}).waitFor();await shot('02-empty');
  await page.locator('#template-name').fill('Docker persistence BT2');
  await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await page.getByRole('button',{name:'Docker persistence BT2',exact:true}).waitFor();
  const marker=(await api('/survey-templates')).find(t=>t.name==='Docker persistence BT2');assert.ok(marker);
  const extra=await api('/survey-templates','POST',{name:'CRUD disposable template',type:'CSAT',question:'Bạn hài lòng với dịch vụ thế nào?',allowComment:true});
  assert.equal((await api('/survey-templates/'+extra.id)).id,extra.id);
  assert.equal((await api('/survey-templates/'+extra.id,'PUT',{...extra,name:'CRUD updated template'})).name,'CRUD updated template');
  await api('/survey-templates/'+extra.id,'DELETE');assert.ok(!(await api('/survey-templates')).some(t=>t.id===extra.id));
  const extraInvitation=await api('/survey-invitations','POST',{supportRequestId:'YC-DEMO-002',customerId:2,templateId:marker.id,channel:'EMAIL'});
  assert.equal((await api('/survey-invitations/'+extraInvitation.id)).id,extraInvitation.id);
  assert.equal((await api('/survey-invitations/'+extraInvitation.id,'PUT',{channel:'SMS'})).channel,'SMS');
  await api('/survey-invitations/'+extraInvitation.id,'DELETE');assert.equal((await api('/survey-invitations')).length,0);
  record('two entities CRUD through Nginx','Template and invitation POST/GET/PUT/DELETE verified against isolated SQLite');
  await page.getByRole('link',{name:'Gửi khảo sát',exact:true}).click();
  await page.getByRole('radio',{name:'Chọn YC-DEMO-001',exact:true}).check();
  await checkResponsive(page,'Invitations');
  await page.locator('#invitation-template').selectOption({label:marker.name});
  await page.getByRole('button',{name:'Gửi lời mời',exact:true}).click();
  const link=page.getByRole('link',{name:'Mở trang khách hàng đánh giá ↗',exact:true});await link.waitFor();await shot('03-invitation');
  const surveyPath=await link.getAttribute('href'),token=surveyPath.split('/').pop();
  const invitations=await api('/survey-invitations');assert.equal(invitations.length,1);
  await api('/public/surveys/'+token,'GET',null,false);
  const survey=await context.newPage();await survey.goto(base+surveyPath);
  await survey.locator('input[name=score][value="5"]').check();await survey.locator('#survey-comment').fill('Docker isolated runtime verification');
  await checkResponsive(survey,'Survey');
  await survey.screenshot({path:path.join(out,'04-public-survey.png'),fullPage:true});
  await survey.getByRole('button',{name:'Gửi',exact:true}).click();await survey.getByText('Cảm ơn bạn đã phản hồi!',{exact:true}).waitFor();
  await survey.screenshot({path:path.join(out,'05-response.png'),fullPage:true});
  await page.getByRole('link',{name:'Báo cáo',exact:true}).click();await page.getByText('100%',{exact:true}).waitFor();await shot('06-dashboard');
  await checkResponsive(page,'Dashboard');
  results.push({step:'five-screen responsive',status:responsive.every(r=>r.status==='PASS')?'PASS':'FAIL',details:responsive});save();
  const summary=await api('/reports/summary');assert.equal(summary.csat,100);assert.equal(summary.responseCount,1);
  record('login, templates, invitation, public response, dashboard',{templateId:marker.id,responseCount:1,csat:100});
  await page.route('**/api/survey-templates',async route=>{await new Promise(r=>setTimeout(r,1600));await route.continue();});
  await page.getByRole('link',{name:'Mẫu khảo sát',exact:true}).click();await page.getByText('Đang tải dữ liệu…',{exact:true}).waitFor();await shot('07-loading');
  await page.getByRole('button',{name:marker.name,exact:true}).waitFor();await page.unroute('**/api/survey-templates');
  compose('stop','api');
  await page.getByRole('link',{name:'Báo cáo',exact:true}).click();await page.getByRole('button',{name:'Thử lại',exact:true}).waitFor();await shot('08-backend-unavailable');
  const unavailable=await fetch(base+'/api/health');http.push({endpoint:'/health (API stopped)',status:unavailable.status});assert.equal(unavailable.status,502);
  compose('start','--wait','api');
  await page.getByRole('button',{name:'Thử lại',exact:true}).click();await page.locator('[name=password]').waitFor();await uiLogin();
  await page.getByText('100%',{exact:true}).waitFor();await shot('09-retry-recovered');
  record('loading, empty, unavailable backend and retry','Loading delays a real request; actual stopped API returns Nginx 502; retry leads to re-login and recovery');
  await page.setViewportSize({width:375,height:812});await shot('10-mobile-dashboard');
  assert.ok(await page.locator('h1').isVisible());
  const dashboardWidth=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  await page.getByRole('link',{name:'Mẫu khảo sát',exact:true}).click();await page.getByRole('button',{name:marker.name,exact:true}).waitFor();await shot('11-mobile-templates');
  const templatesWidth=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  results.push({step:'desktop and mobile',status:dashboardWidth.document<=375&&templatesWidth.document<=375?'PASS':'FAIL',details:{browser:'Chrome headless',desktop:'1440x900',mobile:'375x812',dashboardWidth,templatesWidth}});save();
  const verify=async()=>{await login();assert.ok((await api('/survey-templates')).some(t=>t.id===marker.id&&t.name===marker.name));const s=await api('/reports/summary');assert.equal(s.responseCount,1);assert.equal(s.csat,100);};
  compose('restart','api','web');compose('up','-d','--wait');await verify();record('persistence after restart',{templateId:marker.id,responseCount:1});
  const before=compose('ps','-q','api').trim();
  compose('up','-d','--force-recreate','--wait');assert.notEqual(compose('ps','-q','api').trim(),before);await verify();
  record('persistence after force recreate',{templateId:marker.id,responseCount:1,volume:mount.Name});
  fs.writeFileSync(path.join(out,'final-containers.json'),compose('ps','--format','json'));
 } catch(error){results.push({step:'runtime verification',status:'FAIL',details:error.message.replaceAll(password,'[redacted]')});save();process.exitCode=1;}
 finally {
  await browser?.close();
  if(started){
   try{
    const rawLog=compose('logs','--no-color');
    fs.writeFileSync(path.join(out,'compose.log'),rawLog.replaceAll(password,'[redacted]').replace(/\/(?:api\/public\/surveys|survey)\/[a-zA-Z0-9]{32}/g,'/survey/[test-token]'));
    assert.ok(!rawLog.includes(password));
    assert.ok(!/\/(?:api\/public\/surveys|survey)\/[a-zA-Z0-9]{32}/.test(rawLog),'Raw log contains survey token');
    record('safe raw API and Nginx logs','No test password or survey token path in raw logs before redaction');
   }catch(e){results.push({step:'log collection',status:'FAIL',details:e.message});}
   // Evidence is saved first. Keep the isolated test volume for reproducibility.
   save();
   try{compose('down');record('cleanup','Only test project containers/network removed; test volume retained.');}catch(e){results.push({step:'cleanup',status:'FAIL',details:e.message});}
  }
  save();if(results.some(result=>result.status==='FAIL')) process.exitCode=1;
  console.log(JSON.stringify({project,out,results},null,2));
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
