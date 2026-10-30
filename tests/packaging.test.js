import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { openDatabase } from '../src/backend/repositories/database.js';
import { createLogger } from '../src/backend/logger.js';

test('migration and seed are repeatable without duplicate records',t=>{
 const directory=mkdtempSync(join(tmpdir(),'smartcrm-seed-'));
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 const path=join(directory,'test.sqlite'), env={...process.env,DB_PATH:path};
 const run=()=>{for(const file of ['scripts/migrate.js','scripts/seed.js']) execFileSync(process.execPath,[file],{env,stdio:'pipe'});};
 const counts=()=>{const db=openDatabase(path); try {return ['customer','support_request','survey_template','survey_invitation'].map(table=>db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n);}finally{db.close();}};
 run(); const first=counts(); run(); assert.deepEqual(counts(),first); assert.deepEqual(first,[4,4,1,0]);
});
test('logger filters levels and excludes sensitive context',()=>{
 const lines=[], log=createLogger({level:'warn',write:line=>lines.push(line)});
 log('info','hidden');
 log('error','request failed',{requestId:'test-id',status:500,password:'private',token:'private',body:{email:'private'},url:'/surveys/private'});
 assert.equal(lines.length,1); const item=JSON.parse(lines[0]);
 assert.equal(item.requestId,'test-id'); assert.ok(item.timestamp); assert.equal(item.status,500); assert.ok(!lines[0].includes('private'));
});
