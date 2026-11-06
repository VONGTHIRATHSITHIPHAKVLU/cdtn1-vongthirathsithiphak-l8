import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { templateInput, responseInput } from '../src/backend/validators/survey.js';
import { SurveyService } from '../src/backend/services/survey.service.js';
import { openDatabase } from '../src/backend/repositories/database.js';
import { body, note, fixture } from './helpers/buoi14.js';
const at = '2026-11-06T00:00:00.000Z';

test('TC-01 unit: template trims valid data',t => {
  const actual=templateInput({...body,name:'  Mẫu CSAT  '});
  assert.deepEqual(actual,body); note(t,actual);
});
test('TC-02 unit: CSAT lower boundary 1 accepted',t => {
  const actual=responseInput({score:1},{type:'CSAT',allow_comment:1});
  assert.deepEqual(actual,{score:1,comment:null}); note(t,actual);
});
test('TC-03 unit: CSAT below boundary 0 rejected',t => {
  assert.throws(()=>responseInput({score:0},{type:'CSAT',allow_comment:1}), e=>{
    assert.equal(e.code,'VALIDATION_ERROR'); assert.ok(e.fields.score); note(t,{error:e.code,message:e.message,fields:e.fields}); return true;
  });
});
test('TC-04 unit: wrong score type rejected',t => {
  assert.throws(()=>responseInput({score:'5'},{type:'CSAT',allow_comment:1}),e=>{
    assert.equal(e.code,'VALIDATION_ERROR'); assert.ok(e.fields.score); note(t,{error:e.code,fields:e.fields}); return true;
  });
});
test('TC-05 unit: required template name rejected',t => {
  assert.throws(()=>templateInput({...body,name:''}),e=>{
    assert.equal(e.code,'VALIDATION_ERROR'); assert.ok(e.fields.name); note(t,{error:e.code,fields:e.fields}); return true;
  });
});
test('TC-06 unit: expiry instant blocked with fake clock and repo',t => {
  const service=new SurveyService({byToken:()=>({status:'SENT',expires_at:at})},()=>new Date(at));
  assert.throws(()=>service.publicSurvey('a'.repeat(32)),{code:'EXPIRED'}); note(t,{now:at,expiresAt:at,error:'EXPIRED'});
});
test('TC-07 unit: mixed CSAT NPS summary uses separate denominators',t => {
  const service=new SurveyService({responses:()=>[
    {type:'CSAT',score:4,is_negative:0},{type:'CSAT',score:2,is_negative:1},
    {type:'NPS',score:9,is_negative:0},{type:'NPS',score:6,is_negative:1},{type:'NPS',score:8,is_negative:0}
  ],invitations:()=>Array(5).fill({})},()=>new Date(at));
  const actual=service.summary(); assert.equal(actual.csat,50); assert.equal(actual.nps,0);
  assert.equal(actual.responseCount,5); assert.equal(actual.negativeCount,2); note(t,actual);
});
test('TC-08 integration: incomplete request rolls back',t => {
  const f=fixture(t),before=f.counts();
  assert.throws(()=>f.invite('YC-002'),{code:'REQUEST_NOT_COMPLETED'});
  assert.deepEqual(f.counts(),before); note(t,{error:'REQUEST_NOT_COMPLETED',before,after:f.counts()});
});
test('TC-09 integration: migration and seed repeat on isolated SQLite',t => {
  const directory=mkdtempSync(join(tmpdir(),'buoi14-')); t.after(()=>rmSync(directory,{recursive:true,force:true}));
  const path=join(directory,'test.sqlite');
  const run=()=>{
    for(const file of ['scripts/migrate.js','scripts/seed.js']) execFileSync(process.execPath,[file],{env:{...process.env,DB_PATH:path},stdio:'pipe'});
    const db=openDatabase(path);
    try { return ['customer','support_request','survey_template','survey_invitation','response','survey_log'].map(table=>db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n); }
    finally { db.close(); }
  };
  const first=run(),second=run(); assert.deepEqual(first,[4,4,1,0,0,0]); assert.deepEqual(second,first); note(t,{first,second});
});
test('TC-10 integration: unique tokens, invalid token and one response transaction',t => {
  const f=fixture(t); f.db.exec("UPDATE support_request SET status='COMPLETED' WHERE support_request_id=2");
  const a=f.invite(),b=f.invite('YC-002'),token=a.link.split('/').pop();
  assert.notEqual(a.link,b.link); assert.match(token,/^[a-f0-9]{32}$/);
  const before=f.counts(); assert.throws(()=>f.service.respond('invalid',{score:5}),{code:'NOT_FOUND'}); assert.deepEqual(f.counts(),before);
  assert.equal(f.service.respond(token,{score:5}).score,5);
  assert.throws(()=>f.service.respond(token,{score:4}),{code:'ALREADY_ANSWERED'});
  assert.deepEqual(f.counts(),{survey_template:1,survey_invitation:2,response:1,survey_log:3});
  assert.equal(f.service.invitation(a.id).status,'ANSWERED'); assert.equal(f.service.summary().csat,100);
  note(t,{uniqueTokens:true,invalidToken:'NOT_FOUND',duplicate:'ALREADY_ANSWERED',before,after:f.counts(),csat:100});
});
