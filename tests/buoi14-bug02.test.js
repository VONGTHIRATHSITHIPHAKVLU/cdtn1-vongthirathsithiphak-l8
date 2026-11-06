import { test } from 'node:test';
import assert from 'node:assert/strict';
import { body, note, httpFixture } from './helpers/buoi14.js';
import { request } from 'node:http';
test('TC-12 API regression BUG-14-02: split UTF8 bytes preserve Vietnamese',async t => {
  const f=await httpFixture(t),before=f.counts(),input={...body,name:'Mẫu tiếng Việt'};
  const bytes=Buffer.from(JSON.stringify(input)),split=bytes.indexOf(Buffer.from('ẫ'))+1;
  const actual=await new Promise((resolve,reject)=>{
    const req=request(f.base+'/api/survey-templates',{method:'POST',headers:{...f.headers,'Content-Type':'application/json'}},res=>{
      const chunks=[]; res.on('data',chunk=>chunks.push(chunk)); res.on('end',()=>resolve({status:res.statusCode,response:JSON.parse(Buffer.concat(chunks).toString('utf8'))}));
    });
    req.on('error',reject); req.flushHeaders(); req.write(bytes.subarray(0,split));
    setTimeout(()=>req.end(bytes.subarray(split)),40);
  });
  const stored=f.db.prepare('SELECT name FROM survey_template WHERE template_id=?').get(actual.response.id);
  note(t,{...actual,inputName:input.name,stored,before,after:f.counts(),splitInsideUTF8:true});
  assert.equal(actual.status,201); assert.equal(actual.response.name,input.name); assert.equal(stored.name,input.name);
  assert.equal(f.counts().survey_template,before.survey_template+1);
});
