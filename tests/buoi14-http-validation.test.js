import { test } from 'node:test';
import assert from 'node:assert/strict';
import { body, note, httpFixture } from './helpers/buoi14.js';

test('HTTP-04 supplements TC-04: string score returns 400 without SQLite writes',async t => {
  const f=await httpFixture(t);
  const invitation=f.invite(), token=invitation.link.split('/').pop();
  const path=`/api/public/surveys/${token}/responses`, before=f.counts();
  const statusBefore=f.service.invitation(invitation.id).status;
  const res=await fetch(f.base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({score:'5'})});
  const response=await res.json(), after=f.counts();
  const message='Điểm phải từ 1 đến 5';
  note(t,{method:'POST',path:'/api/public/surveys/:token/responses',input:{score:'5'},status:res.status,response,before,after,statusBefore,statusAfter:f.service.invitation(invitation.id).status});
  assert.equal(res.status,400);
  assert.deepEqual(response,{error:'VALIDATION_ERROR',message,fields:{score:message}});
  assert.deepEqual(after,before);
  assert.equal(f.service.invitation(invitation.id).status,'SENT');
  assert.equal(statusBefore,'SENT');
});

test('HTTP-05 supplements TC-05: empty name returns 400 without SQLite writes',async t => {
  const f=await httpFixture(t),before=f.counts(),input={...body,name:''};
  const res=await fetch(f.base+'/api/survey-templates',{method:'POST',headers:{...f.headers,'Content-Type':'application/json'},body:JSON.stringify(input)});
  const response=await res.json(),after=f.counts(),message='Tên mẫu phải từ 3–100 ký tự';
  note(t,{method:'POST',path:'/api/survey-templates',input,status:res.status,response,before,after});
  assert.equal(res.status,400);
  assert.deepEqual(response,{error:'VALIDATION_ERROR',message,fields:{name:message}});
  assert.deepEqual(after,before);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM survey_template WHERE name=?').get('').n,0);
});
