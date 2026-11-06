import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { SurveyService } from '../../src/backend/services/survey.service.js';
import { SurveyRepository } from '../../src/backend/repositories/survey.repository.js';
import { openDatabase, migrate } from '../../src/backend/repositories/database.js';
import { createApp } from '../../src/backend/server.js';

const at = '2026-11-06T00:00:00.000Z';
export const body = { name:'Mẫu CSAT', type:'CSAT', question:'Bạn hài lòng thế nào?', allowComment:true };
export const note = (t, value) => t.diagnostic(JSON.stringify(value));
export function fixture(t) {
  const db = openDatabase(':memory:'); migrate(db); t.after(() => db.close());
  db.exec(`INSERT INTO customer VALUES(1,'Synthetic customer','test@example.invalid',NULL,0,1);
    INSERT INTO support_request VALUES(1,'YC-001',1,1,'COMPLETED','${at}'),(2,'YC-002',1,1,'OPEN',NULL);`);
  const service = new SurveyService(new SurveyRepository(db), () => new Date(at));
  const template = service.saveTemplate(body,1);
  const invite = (code='YC-001') => service.invite({ supportRequestId:code, customerId:1, templateId:template.id, channel:'EMAIL' },1);
  const counts = () => Object.fromEntries(['survey_template','survey_invitation','response','survey_log'].map(table => [table,db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n]));
  return { db, service, template, invite, counts };
}

export async function httpFixture(t) {
  const f=fixture(t), password=randomBytes(24).toString('hex');
  const app=createApp(f.service,{password,log:()=>{}});
  app.listen(0,'127.0.0.1'); await once(app,'listening');
  t.after(()=>new Promise(resolve=>app.close(resolve)));
  const base=`http://127.0.0.1:${app.address().port}`;
  const login=await fetch(base+'/api/auth/login',{method:'POST',body:JSON.stringify({username:'demo',password})});
  assert.equal(login.status,200); const {token}=await login.json();
  return {...f,base,headers:{Authorization:`Bearer ${token}`}};
}
