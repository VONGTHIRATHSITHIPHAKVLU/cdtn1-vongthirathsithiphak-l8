import { test } from 'node:test';
import assert from 'node:assert/strict';
import { body, note, httpFixture } from './helpers/buoi14.js';

// BUG-14-03 regression: valid JSON is checked against the real schema's
// uniqueness semantics, with no schema modifications or production data.
test('BUG-14-03: SQLite-equivalent template name returns 409 rather than 500',async t=>{
  const f=await httpFixture(t);
  const firstName='Nul\u0000A',nextName='Nul\u0000B';
  const call=name=>fetch(f.base+'/api/survey-templates',{
    method:'POST',headers:{...f.headers,'Content-Type':'application/json'},
    body:JSON.stringify({...body,name})
  });
  const first=await call(firstName),created=await first.json();
  assert.equal(first.status,201); assert.equal(created.name,firstName);
  // Prove uniqueness equivalence using the schema's actual collation.
  const sqliteEqual=f.db.prepare('SELECT ? = ? COLLATE NOCASE AS same').get(firstName,nextName).same;
  assert.equal(sqliteEqual,1); assert.notEqual(firstName.toLowerCase(),nextName.toLowerCase());
  const before=f.counts();
  const rowsBefore=f.db.prepare('SELECT template_id,hex(name) AS nameHex FROM survey_template ORDER BY template_id').all();
  const res=await call(nextName),response=await res.json(),after=f.counts();
  const rowsAfter=f.db.prepare('SELECT template_id,hex(name) AS nameHex FROM survey_template ORDER BY template_id').all();
  note(t,{method:'POST',path:'/api/survey-templates',first:{name:firstName,status:first.status},second:{name:nextName,status:res.status,response},sqliteEqual,javascriptEqual:firstName.toLowerCase()===nextName.toLowerCase(),before,after,rowsBefore,rowsAfter,expected:{status:409,error:'TEMPLATE_NAME_EXISTS',databaseUnchanged:true}});
  assert.deepEqual(after,before); assert.deepEqual(rowsAfter,rowsBefore);
  assert.equal(res.status,409); assert.equal(response.error,'TEMPLATE_NAME_EXISTS');
});

test('BUG-14-03: update excludes its own ID but blocks another SQLite-equivalent name',async t=>{
  const f=await httpFixture(t);
  const call=(method,path,name)=>fetch(f.base+path,{method,headers:f.headers,body:JSON.stringify({...body,name})});
  let res=await call('POST','/api/survey-templates','Nul\u0000A');
  assert.equal(res.status,201);const first=await res.json();
  res=await call('POST','/api/survey-templates','Other template');
  assert.equal(res.status,201);const other=await res.json();
  res=await call('PUT','/api/survey-templates/'+first.id,'nUL\u0000A');
  const updated=await res.json();assert.equal(res.status,200);assert.equal(updated.id,first.id);assert.equal(updated.name,'nUL\u0000A');
  const before=f.db.prepare('SELECT template_id,hex(name) nameHex FROM survey_template ORDER BY template_id').all();
  res=await call('PUT','/api/survey-templates/'+other.id,'Nul\u0000B');
  const response=await res.json(),after=f.db.prepare('SELECT template_id,hex(name) nameHex FROM survey_template ORDER BY template_id').all();
  note(t,{selfUpdate:{status:200,id:updated.id,name:updated.name},conflictingUpdate:{status:res.status,response},before,after});
  assert.equal(res.status,409);assert.equal(response.error,'TEMPLATE_NAME_EXISTS');assert.deepEqual(after,before);
});

test('BUG-14-03: preserve Unicode case-insensitive duplicates and valid distinct names',async t=>{
  const f=await httpFixture(t);
  const create=name=>fetch(f.base+'/api/survey-templates',{method:'POST',headers:f.headers,body:JSON.stringify({...body,name})});
  let res=await create('ÁBC');assert.equal(res.status,201);await res.json();
  const before=f.counts();res=await create('ábc');const response=await res.json();
  note(t,{unicodeDuplicate:{status:res.status,response},before,after:f.counts()});
  assert.equal(res.status,409);assert.equal(response.error,'TEMPLATE_NAME_EXISTS');assert.deepEqual(f.counts(),before);
  res=await create('Another valid name');const created=await res.json();
  note(t,{distinctName:{status:res.status,name:created.name},after:f.counts()});
  assert.equal(res.status,201);assert.equal(created.name,'Another valid name');assert.equal(f.counts().survey_template,before.survey_template+1);
});
