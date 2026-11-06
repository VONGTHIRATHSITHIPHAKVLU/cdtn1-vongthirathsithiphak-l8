import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { apiRouter } from '../src/backend/routes/api.js';
import { body, note, httpFixture } from './helpers/buoi14.js';

test('EXP-01: JSON/body size and unauthenticated writes preserve SQLite',async t=>{
  const f=await httpFixture(t),before=f.counts();
  const exact=JSON.stringify({...body,name:'Body boundary'})+' '.repeat(16384-Buffer.byteLength(JSON.stringify({...body,name:'Body boundary'})));
  // Validate parser's byte limit on a public response URL with a nonexistent token.
  // At the limit routing must run (404); one byte over must fail in parser (413).
  const path='/api/public/surveys/'+'b'.repeat(32)+'/responses';
  for(const [input,status,error] of [[exact,404,'NOT_FOUND'],[exact+' ',413,'BODY_TOO_LARGE'],['{',400,'INVALID_JSON'],['[]',400,'INVALID_JSON'],['null',400,'INVALID_JSON']]) {
    const res=await fetch(f.base+path,{method:'POST',body:input}),response=await res.json();
    note(t,{bytes:Buffer.byteLength(input),status:res.status,response,before,after:f.counts()});
    assert.equal(res.status,status); assert.equal(response.error,error); assert.deepEqual(f.counts(),before);
  }
  const res=await fetch(f.base+'/api/survey-templates',{method:'POST',body:JSON.stringify(body)}),response=await res.json();
  note(t,{unauthenticated:true,status:res.status,response,before,after:f.counts()});
  assert.equal(res.status,401); assert.equal(response.error,'UNAUTHORIZED'); assert.deepEqual(f.counts(),before);
});

test('EXP-02: missing request, wrong customer and missing contact do not write',async t=>{
  const f=await httpFixture(t),before=f.counts();
  for(const [input,status,error] of [
    [{supportRequestId:'MISSING',customerId:1,templateId:1,channel:'EMAIL'},404,'NOT_FOUND'],
    [{supportRequestId:'YC-001',customerId:2,templateId:1,channel:'EMAIL'},400,'CUSTOMER_MISMATCH'],
    [{supportRequestId:'YC-001',customerId:1,templateId:1,channel:'SMS'},400,'CONTACT_MISSING']
  ]) {
    const res=await fetch(f.base+'/api/survey-invitations',{method:'POST',headers:f.headers,body:JSON.stringify(input)}),response=await res.json();
    note(t,{input,status:res.status,response,before,after:f.counts()});
    assert.equal(res.status,status); assert.equal(response.error,error); assert.deepEqual(f.counts(),before);
  }
});

test('EXP-03: login lockout and session expiry at exact fake-clock boundaries',t=>{
  let now=0; const password=randomBytes(24).toString('hex');
  const route=apiRouter({templates:()=>[]},{password,now:()=>now});
  for(let n=0;n<5;n++) assert.throws(()=>route('POST','/api/auth/login',{username:'demo',password:'wrong'}),{code:'INVALID_CREDENTIALS'});
  assert.throws(()=>route('POST','/api/auth/login',{username:'demo',password}),{code:'ACCOUNT_LOCKED'});
  now=899999;
  assert.throws(()=>route('POST','/api/auth/login',{username:'demo',password}),{code:'ACCOUNT_LOCKED'});
  now=900000;
  const [status,session]=route('POST','/api/auth/login',{username:'demo',password}); assert.equal(status,200);
  now=4499999; assert.deepEqual(route('GET','/api/survey-templates',{},`Bearer ${session.token}`),[200,[]]);
  now=4500000; assert.throws(()=>route('GET','/api/survey-templates',{},`Bearer ${session.token}`),{code:'UNAUTHORIZED'});
  note(t,{failedLogins:5,lockedAtMs:[0,899999],unlockedAtMs:900000,sessionWorksAtMs:4499999,sessionExpiresAtMs:4500000,tokensLogged:false});
});
