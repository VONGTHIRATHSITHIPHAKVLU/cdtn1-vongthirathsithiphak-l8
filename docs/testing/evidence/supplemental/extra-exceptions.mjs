import { test } from 'node:test';
import assert from 'node:assert/strict';
import { body, httpFixture, note } from '../../../../tests/helpers/buoi14.js';

test('PROBE-01: template field partitions and case-insensitive duplicate do not write',async t=>{
 const f=await httpFixture(t), before=f.counts();
 for(const [input,field] of [
  [{...body,name:'ab'},'name'],[{...body,name:'x'.repeat(101)},'name'],
  [{...body,type:'OTHER'},'type'],[{...body,question:'123456789'},'question'],
  [{...body,allowComment:'true'},'allowComment']
 ]) {
  const r=await fetch(f.base+'/api/survey-templates',{method:'POST',headers:f.headers,body:JSON.stringify(input)}),response=await r.json();
  note(t,{field,status:r.status,response,before,after:f.counts()});
  assert.equal(r.status,400);assert.equal(response.error,'VALIDATION_ERROR');assert.ok(response.fields[field]);assert.equal(response.message,response.fields[field]);assert.deepEqual(f.counts(),before);
 }
 const r=await fetch(f.base+'/api/survey-templates',{method:'POST',headers:f.headers,body:JSON.stringify({...body,name:body.name.toUpperCase()})}),response=await r.json();
 note(t,{duplicateName:true,status:r.status,response,before,after:f.counts()});
 assert.equal(r.status,409);assert.equal(response.error,'TEMPLATE_NAME_EXISTS');assert.deepEqual(f.counts(),before);
});
test('PROBE-02: invalid score partitions and disabled comment roll back',async t=>{
 const f=await httpFixture(t);f.db.exec('UPDATE survey_template SET allow_comment=0');
 const item=f.invite(),token=item.link.split('/').pop(),before=f.counts();
 for(const input of [{score:-1},{score:6},{score:null},{score:2.5},{score:{}},{score:[]},{score:4,comment:'Not allowed'}]){
  const r=await fetch(f.base+'/api/public/surveys/'+token+'/responses',{method:'POST',body:JSON.stringify(input)}),response=await r.json();
  note(t,{input,status:r.status,response,before,after:f.counts(),invitationStatus:f.service.invitation(item.id).status});
  assert.equal(r.status,400);assert.equal(response.error,'VALIDATION_ERROR');assert.deepEqual(f.counts(),before);assert.equal(f.service.invitation(item.id).status,'SENT');
 }
});
test('PROBE-03: used template mutation and deleted survey token are blocked',async t=>{
 const f=await httpFixture(t),item=f.invite(),token=item.link.split('/').pop(),before=f.counts();
 for(const method of ['PUT','DELETE']){
  const r=await fetch(f.base+'/api/survey-templates/1',{method,headers:f.headers,...(method==='PUT'?{body:JSON.stringify({...body,name:'Changed used'})}:{})}),response=await r.json();
  note(t,{method,status:r.status,response,before,after:f.counts()});
  assert.equal(r.status,409);assert.equal(response.error,'TEMPLATE_IN_USE');assert.deepEqual(f.counts(),before);
 }
 f.service.deleteInvitation(item.id);const afterDelete=f.counts();
 const r=await fetch(f.base+'/api/public/surveys/'+token),response=await r.json();
 note(t,{deletedToken:true,status:r.status,response,before:afterDelete,after:f.counts()});
 assert.equal(r.status,404);assert.equal(response.error,'NOT_FOUND');assert.deepEqual(f.counts(),afterDelete);
});
