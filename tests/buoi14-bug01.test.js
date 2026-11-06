import { test } from 'node:test';
import assert from 'node:assert/strict';
import { body, note, httpFixture } from './helpers/buoi14.js';
test('TC-11 API regression BUG-14-01: PUT id zero cannot create template',async t => {
  const f=await httpFixture(t),before=f.counts();
  const res=await fetch(f.base+'/api/survey-templates/0',{method:'PUT',headers:f.headers,body:JSON.stringify({...body,name:'Unexpected create'})});
  const response=await res.json(),after=f.counts(); note(t,{method:'PUT',path:'/api/survey-templates/0',status:res.status,response,before,after});
  assert.equal(res.status,404); assert.equal(response.error,'NOT_FOUND'); assert.deepEqual(after,before);
});
