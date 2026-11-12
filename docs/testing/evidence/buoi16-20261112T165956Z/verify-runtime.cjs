// Reproducible runtime checks for this LOCAL SNAPSHOT, not a GitHub clone.
// No credential, survey URL or response body containing a token is written.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {parseEnv}=require('node:util');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../../../../.tmp/tools/node_modules/playwright');
const out=process.argv[2]?path.resolve(process.argv[2]):__dirname, root=path.resolve(__dirname,'../../../..');
const snapshot=JSON.parse(fs.readFileSync(path.join(out,'run.json'),'utf8').replace(/^\uFEFF/,'')).snapshot;
const base='http://127.0.0.1:8080';
const password=parseEnv(fs.readFileSync(path.join(snapshot,'.env'),'utf8')).DEMO_PASSWORD;
const secrets=[password], steps=[];
let browser;
function save(){fs.writeFileSync(path.join(out,'runtime-results.json'),JSON.stringify({kind:'local snapshot, not GitHub clone',snapshot,base,steps},null,2));}
function record(check,details){steps.push({check,status:'PASS',details});save();}
function compose(...args){return execFileSync('docker',['compose',...args],{cwd:snapshot,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:180000});}
async function request(endpoint,{method='GET',body,token}={}){
 const r=await fetch(base+'/api'+endpoint,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await r.json();
 assert.ok(r.ok,'HTTP check failed (URL/body intentionally not recorded)');return data;
}
async function login(){const result=await request('/auth/login',{method:'POST',body:{username:'demo',password}});secrets.push(result.token);return result.token;}
const countCode="import {openDatabase} from './src/backend/repositories/database.js'; const db=openDatabase(); console.log(JSON.stringify(['customer','support_request','survey_template','survey_invitation','response','survey_log'].map(t=>db.prepare('SELECT COUNT(*) n FROM '+t).get().n)));db.close();";
function counts(){return JSON.parse(compose('exec','-T','api','node','--input-type=module','-e',countCode).trim());}
async function captureFile(page,filename,screenshot,bottom=false){
 await page.goto(pathToFileURL(path.join(out,filename)).href);
 if(bottom) await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
 await page.screenshot({path:path.join(out,screenshot)});
}
(async()=>{
 try{
  const ps=compose('ps','--format','json');fs.writeFileSync(path.join(out,'containers.ndjson'),ps);
  const containers=ps.trim().split('\n').map(line=>JSON.parse(line));
  for(const service of ['api','web']) assert.equal(containers.find(c=>c.Service===service)?.Health,'healthy');
  record('API and frontend Docker health',{services:['api','web'],health:'healthy'});
  fs.writeFileSync(path.join(out,'docker-healthy.txt'),compose('ps'));
  assert.deepEqual(await request('/health'),{status:'ok'});
  const home=await fetch(base);assert.equal(home.status,200);assert.ok((await home.text()).includes('root'));
  record('Web and proxied SQLite health',{webHTTP:200,health:{status:'ok'}});
  const initial=counts();assert.deepEqual(initial,[4,4,1,0,0,0]);record('Fresh demo counts',initial);
  let token=await login();
  const templates=await request('/survey-templates',{token});assert.equal(templates[0].type,'CSAT');
  const requests=await request('/support-requests',{token});assert.equal(requests.length,4);
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  page.on('response',async response=>{
   if(response.url().endsWith('/api/auth/login')){try{const result=await response.json();if(result.token)secrets.push(result.token);}catch{}}
  });
  await page.goto(base);await page.locator('input[name=password]').fill(password);
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await page.getByRole('heading',{name:'Mẫu khảo sát',exact:true}).waitFor();
  await page.getByRole('button',{name:'CSAT sau hỗ trợ',exact:true}).waitFor();
  await page.screenshot({path:path.join(out,'clean-web-demo.png'),fullPage:true});
  record('Real Chrome login and seeded template',{seededTemplateVisible:true});
  const invitation=await request('/survey-invitations',{method:'POST',token,body:{supportRequestId:'YC-DEMO-001',customerId:1,templateId:1,channel:'EMAIL'}});
  const surveyToken=invitation.link.split('/').pop();secrets.push(surveyToken);
  await request('/public/surveys/'+surveyToken);
  await request('/public/surveys/'+surveyToken+'/responses',{method:'POST',body:{score:5,comment:'Synthetic Buoi 16 verification'}});
  const summary=await request('/reports/summary',{token});assert.equal(summary.responseCount,1);assert.equal(summary.csat,100);
  record('Survey workflow',{responseCount:summary.responseCount,csat:summary.csat});
  const before=counts();const seedLogs=[];
  for(let i=0;i<2;i++) for(const script of ['scripts/migrate.js','scripts/seed.js']) seedLogs.push(compose('exec','-T','api','node',script));
  fs.writeFileSync(path.join(out,'docker-seed-repeat.txt'),seedLogs.join(''));
  assert.deepEqual(counts(),before);record('Docker migrate/seed twice preserves counts',{before,after:counts()});
  compose('restart','api');compose('up','-d','--wait','--wait-timeout','90');
  token=await login();assert.deepEqual(counts(),before);
  const afterSummary=await request('/reports/summary',{token});assert.equal(afterSummary.responseCount,1);
  record('SQLite data survives API restart',{before,after:counts(),responseCount:afterSummary.responseCount});
  const volumes=JSON.parse(compose('ps','--format','json').trim().split('\n').find(line=>JSON.parse(line).Service==='api'));
  record('Separate Compose project',{project:volumes.Project});
  const logs=compose('logs','--no-color');
  const leaked=secrets.some(value=>value&&logs.includes(value));
  const sensitiveBodyLogged=logs.includes('Synthetic Buoi 16 verification');
  // Do not persist raw logs if the privacy assertion fails.
  if(!leaked&&!sensitiveBodyLogged)fs.writeFileSync(path.join(out,'docker-logs-safe.txt'),logs);
  fs.writeFileSync(path.join(out,'log-privacy.json'),JSON.stringify({credentialOrTokenFound:leaked,syntheticCommentFound:sensitiveBodyLogged,checkedSecrets:secrets.length,rawLogSaved:!leaked&&!sensitiveBodyLogged},null,2));
  assert.equal(leaked,false);assert.equal(sensitiveBodyLogged,false);
  record('Raw Docker log privacy',{passwordAndAllObservedTokensAbsent:true,commentAbsent:true});
  const viewer=await context.newPage();
  await captureFile(viewer,'docker-healthy.txt','docker-healthy-raw-log-browser.png');
  await captureFile(viewer,'snapshot-npm-test.txt','tests-pass-raw-log-browser.png',true);
  await viewer.goto(base+'/api/health');await viewer.screenshot({path:path.join(out,'clean-api-health.png')});
  record('Screenshots',{web:'actual live application',health:'actual live API response',dockerAndTests:'Chrome showing unmodified raw command-output files; not OS terminal screenshots'});
 }catch{
  steps.push({check:'Runtime verification interrupted',status:'FAIL',details:'Inspect completed steps. Error body/URL suppressed to avoid exposing credentials.'});save();process.exitCode=1;
 }finally{if(browser)await browser.close();}
 console.log(JSON.stringify({checks:steps.map(({check,status})=>({check,status})),result:process.exitCode?'FAIL':'PASS'},null,2));
})();
