import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { body, note, httpFixture } from '../../../../tests/helpers/buoi14.js';

function cite(t,file,needle,sources) {
 const lines=readFileSync(new URL('../../../../'+file,import.meta.url),'utf8').split(/\r?\n/);
 const i=lines.findIndex(l=>l.includes(needle));assert.ok(i>=0);
 const source=sources.map(([path,search])=>{
  const text=readFileSync(new URL('../../../../'+path,import.meta.url),'utf8').split(/\r?\n/);
  const n=text.findIndex(l=>l.includes(search));assert.ok(n>=0);return {file:path,line:n+1,code:text[n].trim()};
 });
 note(t,{requirement:{file,line:i+1,quote:lines[i].trim()},source});
}
const svc='src/backend/services/survey.service.js',repo='src/backend/repositories/survey.repository.js',routes='src/backend/routes/api.js';
async function call(f,path,method='GET',input,headers=f.headers) {
 const res=await fetch(f.base+path,{method,headers:{'Content-Type':'application/json',...headers},...(input===undefined?{}:{body:JSON.stringify(input)})});
 return {status:res.status,response:await res.json()};
}
const safeResult=r=>r.response?.token ? {status:r.status,sessionReturned:true} : r;
function snapshot(f) {
 return {counts:f.counts(),invitations:f.db.prepare('SELECT invitation_id,channel,status FROM survey_invitation ORDER BY invitation_id').all(),
 responses:f.db.prepare('SELECT response_id,invitation_id,score,comment,is_negative FROM response ORDER BY response_id').all(),
 logs:f.db.prepare('SELECT log_id,invitation_id,event,actor_type,actor_id FROM survey_log ORDER BY log_id').all()};
}
test('DEEP-01 admin access without session, forged session and survey token',async t=>{
 cite(t,'docs/api-contract.md','| GET | `/api/survey-templates`',[[routes,"const token = authorization"]]);
 const f=await httpFixture(t),survey=f.invite(),surveyToken=survey.link.split('/').pop(),before=snapshot(f);
 const paths=[['GET','/api/survey-templates'],['POST','/api/survey-templates'],['GET','/api/survey-templates/1'],['PUT','/api/survey-templates/1'],['DELETE','/api/survey-templates/1'],
 ['GET','/api/survey-invitations'],['POST','/api/survey-invitations'],['GET','/api/survey-invitations/1'],['PUT','/api/survey-invitations/1'],['DELETE','/api/survey-invitations/1'],
 ['GET','/api/support-requests'],['GET','/api/reports/summary'],['POST','/api/auth/logout']];
 for(const [credential,headers] of [['none',{}],['forged manager claim',{Authorization:'Bearer '+Buffer.from('{"role":"MANAGER"}').toString('base64url')}],['survey token',{Authorization:'Bearer '+surveyToken}]]) {
  for(const [method,path] of paths) {
   const r=await call(f,path,method,['POST','PUT'].includes(method)?body:undefined,headers);
   note(t,{credential,method,path,...safeResult(r),databaseUnchanged:JSON.stringify(snapshot(f))===JSON.stringify(before)});
   assert.equal(r.status,401);assert.equal(r.response.error,'UNAUTHORIZED');assert.deepEqual(snapshot(f),before);
  }
 }
 assert.equal((await call(f,'/api/survey-templates')).status,200);
 assert.equal((await call(f,'/api/auth/logout','POST',{})).status,200);
 assert.equal((await call(f,'/api/survey-templates')).status,401);
 note(t,{realNonManagerRole:'NOT RUN: SRS explicitly provides only one demo MANAGER; forged-token rejection is not a cross-role authorization test'});
});
test('DEEP-02 invitation eligibility and duplicate request leave SQLite unchanged',async t=>{
 cite(t,'docs/api-contract.md','- Invitation:',[[svc,'invite(body, actor)']]);
 for(const scenario of ['OPEN','OPT_OUT','INACTIVE','DUPLICATE']) {
  const f=await httpFixture(t);
  if(scenario==='OPT_OUT')f.db.exec('UPDATE customer SET survey_opt_out=1');
  if(scenario==='INACTIVE')f.db.exec('UPDATE customer SET is_active=0');
  if(scenario==='DUPLICATE')f.invite();
  const before=snapshot(f),input={supportRequestId:scenario==='OPEN'?'YC-002':'YC-001',customerId:1,templateId:1,channel:'EMAIL'};
  const r=await call(f,'/api/survey-invitations','POST',input);
  const error=scenario==='OPEN'?'REQUEST_NOT_COMPLETED':scenario==='DUPLICATE'?'INVITATION_EXISTS':'CUSTOMER_OPTED_OUT';
  note(t,{scenario,input,...r,before,after:snapshot(f)});
  assert.equal(r.status,scenario==='OPEN'?400:409);assert.equal(r.response.error,error);assert.deepEqual(snapshot(f),before);
 }
});
test('DEEP-03 expiry minus 1ms, exact expiry and plus 1ms over HTTP',async t=>{
 cite(t,'docs/srs.md','thời điểm hiện tại < expiresAt',[[svc,'invitation.expires_at <= this.now()']]);
 for(const offset of [-1,0,1]) {
  const f=await httpFixture(t),item=f.invite(),token=item.link.split('/').pop();
  f.service.now=()=>new Date(Date.parse(item.expiresAt)+offset);
  const before=snapshot(f);
  const form=await call(f,'/api/public/surveys/'+token,'GET',undefined,{});
  const result=await call(f,'/api/public/surveys/'+token+'/responses','POST',{score:5},{});
  note(t,{offsetMs:offset,expiresAt:item.expiresAt,formStatus:form.status,result,before,after:snapshot(f)});
  assert.equal(form.status,offset<0?200:409);assert.equal(result.status,offset<0?201:409);
  if(offset>=0){assert.equal(result.response.error,'EXPIRED');assert.deepEqual(snapshot(f),before);}
  else {assert.equal(f.counts().response,1);assert.equal(f.service.invitation(item.id).status,'ANSWERED');}
 }
});
test('DEEP-04 two simultaneous responses: one 201 and one 409, repeated 20 times',async t=>{
 cite(t,'docs/srs.md','trả lời lần hai 409 ALREADY_ANSWERED',[[svc,'respond(token, body)'],[repo,"BEGIN IMMEDIATE"]]);
 for(let attempt=1;attempt<=20;attempt++){
  const f=await httpFixture(t),item=f.invite(),token=item.link.split('/').pop();
  const results=await Promise.all([call(f,'/api/public/surveys/'+token+'/responses','POST',{score:5},{}),call(f,'/api/public/surveys/'+token+'/responses','POST',{score:4},{})]);
  note(t,{attempt,results,after:snapshot(f)});
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  assert.equal(results.find(r=>r.status===409).response.error,'ALREADY_ANSWERED');
  assert.equal(f.counts().response,1);assert.equal(f.counts().survey_log,2);assert.equal(f.service.invitation(item.id).status,'ANSWERED');
 }
 note(t,{scope:'20 pairs on one real Node HTTP server per fixture; not a multi-process or load test'});
});
test('DEEP-05 CSAT/NPS boundary and null/string/fraction score matrix',async t=>{
 cite(t,'docs/api-contract.md','- Response:',[['src/backend/validators/survey.js','if (!Number.isInteger(body.score)']]);
 for(const type of ['CSAT','NPS']) {
  const f=await httpFixture(t);f.db.prepare('UPDATE survey_template SET type=?').run(type);
  const item=f.invite(),token=item.link.split('/').pop(),before=snapshot(f);
  for(const score of [undefined,null,'5',2.5,type==='CSAT'?0:-1,type==='CSAT'?6:11]) {
   const r=await call(f,'/api/public/surveys/'+token+'/responses','POST',score===undefined?{}:{score},{});
   note(t,{type,input:score===undefined?'missing':score,...r,after:snapshot(f)});
   assert.equal(r.status,400);assert.equal(r.response.error,'VALIDATION_ERROR');assert.equal(r.response.message,r.response.fields.score);assert.deepEqual(snapshot(f),before);
  }
 }
 for(const [type,score] of [['CSAT',1],['CSAT',5],['NPS',0],['NPS',10]]) {
  const f=await httpFixture(t);f.db.prepare('UPDATE survey_template SET type=?').run(type);
  const item=f.invite(),token=item.link.split('/').pop(),r=await call(f,'/api/public/surveys/'+token+'/responses','POST',{score},{});
  note(t,{type,score,...r,after:snapshot(f)});
  assert.equal(r.status,201);assert.equal(r.response.score,score);assert.equal(f.counts().response,1);
  assert.equal(r.response.flaggedNegative,score<=(type==='NPS'?6:2));
 }
});
test('DEEP-06 used templates cannot be edited or deleted before or after response',async t=>{
 cite(t,'docs/srs.md','Mẫu đã dùng không chỉnh sửa',[[svc,'if (this.repo.usedTemplate(id))']]);
 for(const answered of [false,true]) {
  const f=await httpFixture(t),item=f.invite();
  if(answered)f.service.respond(item.link.split('/').pop(),{score:5});
  const before=snapshot(f),template=f.service.template(1);
  for(const method of ['PUT','DELETE']){
   const r=await call(f,'/api/survey-templates/1',method,method==='PUT'?{...body,type:'NPS',name:'Changed template'}:undefined);
   note(t,{answered,method,...r,before,after:snapshot(f)});
   assert.equal(r.status,409);assert.equal(r.response.error,'TEMPLATE_IN_USE');assert.deepEqual(snapshot(f),before);assert.deepEqual(f.service.template(1),template);
  }
 }
});
for(const operation of ['invite','respond','update','delete']) {
 test('DEEP-rollback-'+operation+': SQLite failure mid-transaction restores all rows',async t=>{
  cite(t,'docs/srs.md','ghi log trong một transaction',[[repo,'transaction(work)'],[repo,"ROLLBACK"]]);
  const f=await httpFixture(t);f.db.exec("UPDATE customer SET phone='0900000000'");
  const item=operation==='invite'?null:f.invite(),token=item?.link.split('/').pop();
  const before=snapshot(f);
  const event={invite:'INVITATION_CREATED',respond:'RESPONSE_SUBMITTED',update:'INVITATION_UPDATED'}[operation];
  // Fault injection ONLY in isolated :memory: test DB. No source/schema file edits.
  // A deliberately injected storage failure is not claimed as a product bug.
  f.db.exec(operation==='delete'
   ? "CREATE TEMP TRIGGER deep_fault BEFORE DELETE ON survey_invitation BEGIN SELECT RAISE(ABORT,'TEST_ONLY_STORAGE_FAULT'); END;"
   : "CREATE TEMP TRIGGER deep_fault BEFORE INSERT ON survey_log WHEN NEW.event='"+event+"' BEGIN SELECT RAISE(ABORT,'TEST_ONLY_STORAGE_FAULT'); END;");
  const input={supportRequestId:'YC-001',customerId:1,templateId:1,channel:'EMAIL'};
  const work=()=>operation==='invite'?call(f,'/api/survey-invitations','POST',input)
   :operation==='respond'?call(f,'/api/public/surveys/'+token+'/responses','POST',{score:5},{})
   :call(f,'/api/survey-invitations/'+item.id,operation==='update'?'PUT':'DELETE',operation==='update'?{channel:'SMS'}:undefined);
  const result=await work(),after=snapshot(f);
  note(t,{operation,faultInjection:true,scope:'TEMP trigger in isolated in-memory fixture only',result,before,after});
  assert.equal(result.status,500);assert.equal(result.response.error,'INTERNAL_ERROR');assert.deepEqual(after,before);
  f.db.exec('DROP TRIGGER deep_fault');
  const retry=await work();note(t,{operation,retry:safeResult(retry),afterRetry:snapshot(f)});
  assert.equal(retry.status,operation==='invite'||operation==='respond'?201:200);
  if(operation==='respond')assert.equal(f.counts().response,1);
 });
}
