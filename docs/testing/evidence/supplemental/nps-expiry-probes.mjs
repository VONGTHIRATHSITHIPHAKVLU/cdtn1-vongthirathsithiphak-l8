import { test } from 'node:test';
import assert from 'node:assert/strict';
import { httpFixture, note } from '../../../../tests/helpers/buoi14.js';
test('PROBE-04: NPS invalid values and comment types preserve SQLite',async t=>{
 const f=await httpFixture(t);f.db.exec("UPDATE survey_template SET type='NPS'");
 const item=f.invite(),token=item.link.split('/').pop(),before=f.counts();
 for(const input of [{score:-1},{score:11},{score:'10'},{score:5,comment:42},{score:5,comment:null}]){
  const res=await fetch(f.base+'/api/public/surveys/'+token+'/responses',{method:'POST',body:JSON.stringify(input)}),response=await res.json();
  note(t,{input,status:res.status,response,before,after:f.counts(),statusAfter:f.service.invitation(item.id).status});
  assert.equal(res.status,400);assert.equal(response.error,'VALIDATION_ERROR');
  const field=input.comment!==undefined?'comment':'score';
  assert.equal(response.message,response.fields[field]);assert.deepEqual(f.counts(),before);assert.equal(f.service.invitation(item.id).status,'SENT');
 }
});
test('PROBE-05: expired invitation cannot be updated or answered',async t=>{
 const f=await httpFixture(t),item=f.invite(),token=item.link.split('/').pop();
 f.db.prepare('UPDATE survey_invitation SET expires_at=? WHERE invitation_id=?').run('2026-11-05T00:00:00.000Z',item.id);
 const before=f.counts();
 for(const [path,method,input,code] of [
 ['/api/survey-invitations/'+item.id,'PUT',{channel:'EMAIL'},'INVITATION_LOCKED'],
 ['/api/public/surveys/'+token+'/responses','POST',{score:4},'EXPIRED']
 ]){
  const res=await fetch(f.base+path,{method,headers:f.headers,body:JSON.stringify(input)}),response=await res.json();
  note(t,{operation:code,status:res.status,response,before,after:f.counts()});
  assert.equal(res.status,409);assert.equal(response.error,code);assert.deepEqual(f.counts(),before);
 }
});
