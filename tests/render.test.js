import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRenderApp, renderSettings } from '../src/backend/render-app.js';
import { openDatabase, migrate } from '../src/backend/repositories/database.js';
import { SurveyRepository } from '../src/backend/repositories/survey.repository.js';
import { SurveyService } from '../src/backend/services/survey.service.js';

test('Render requires explicit demo mode, strong provisioning and a valid dynamic port', () => {
  const env={DEMO_ONLY:'true',DEMO_PASSWORD:randomBytes(32).toString('hex'),PORT:'12345'};
  assert.deepEqual(renderSettings(env),{port:12345,host:'0.0.0.0'});
  for (const override of [{DEMO_ONLY:''},{DEMO_PASSWORD:''},{DEMO_PASSWORD:'short'},{PORT:'0'},{PORT:'65536'},{PORT:'bad'}]) {
    assert.throws(()=>renderSettings({...env,...override}));
  }
});

test('Render same-origin adapter isolates files, preserves API auth, bounds requests and hides secrets',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'smartcrm-render-'));
  mkdirSync(join(dir,'assets'));
  writeFileSync(join(dir,'index.html'),'<div id="root">demo</div>');
  writeFileSync(join(dir,'assets','index-test.js'),'console.log("demo");');
  writeFileSync(join(dir,'assets','index-test.js.map'),'not public');
  writeFileSync(join(dir,'.env'),'not public');
  const db=openDatabase(':memory:'); migrate(db);
  const lines=[], password=randomBytes(32).toString('hex');
  const app=createRenderApp(new SurveyService(new SurveyRepository(db)),{
    dist:dir,password,log:(...args)=>lines.push(JSON.stringify(args)),
  });
  app.listen(0,'127.0.0.1'); await once(app,'listening');
  let databaseClosed=false;
  t.after(async()=>{await new Promise(resolve=>app.close(resolve));if(!databaseClosed)db.close();rmSync(dir,{recursive:true,force:true});});
  const base=`http://127.0.0.1:${app.address().port}`;
  const home=await fetch(base+'/'); assert.equal(home.status,200);
  assert.match(home.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.equal(home.headers.get('referrer-policy'),'no-referrer');
  assert.equal(home.headers.get('set-cookie'),null);
  assert.equal((await fetch(base+'/survey/'+'a'.repeat(32))).status,200);
  assert.equal((await fetch(base+'/assets/index-test.js')).status,200);
  assert.equal(await (await fetch(base+'/',{method:'HEAD'})).text(),'');
  for(const path of ['/.env','/data/render-demo.sqlite','/src/backend/auth.js','/assets/index-test.js.map','/assets/%2e%2e%2f.env','/missing']) {
    assert.equal((await fetch(base+path)).status,404);
  }
  assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
  assert.deepEqual(await (await fetch(base+'/api/health')).json(),{status:'ok'});
  for(const path of ['/api/survey-templates','/api/survey-invitations','/api/support-requests','/api/reports/summary']) {
    assert.equal((await fetch(base+path)).status,401);
  }
  const login=await fetch(base+'/api/auth/login',{method:'POST',body:JSON.stringify({username:'demo',password})});
  assert.equal(login.status,200); const {token}=await login.json();
  assert.equal((await fetch(base+'/api/survey-templates',{headers:{Authorization:'Bearer '+token}})).status,200);
  assert.equal((await fetch(base+'/api/public/surveys/'+'b'.repeat(32))).status,404);
  for(let i=0;i<120;i++) await fetch(base+'/api/survey-templates');
  const limited=await fetch(base+'/api/survey-templates'); assert.equal(limited.status,429);
  assert.equal(limited.headers.get('retry-after'),'60');
  assert.equal((await fetch(base+'/api/health')).status,200);
  for(const secret of [password,token,'b'.repeat(32)]) assert.ok(!lines.join('').includes(secret));
  db.close();
  databaseClosed=true;
  assert.equal((await fetch(base+'/api/health')).status,500);
});
