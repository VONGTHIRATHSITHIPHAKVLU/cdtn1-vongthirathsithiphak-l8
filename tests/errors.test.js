import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLogger, errorDetails } from '../src/backend/logger.js';
import { createApp } from '../src/backend/server.js';
import { AppError } from '../src/backend/services/errors.js';
import { request } from '../src/frontend/src/api/client.js';

function incident() {
  const cause = Object.assign(new Error('password=private-password token=private-token customer@example.com'),{code:'EIO'});
  cause.stack = 'Error: private-password\n    at read (C:\\private-user\\project\\src\\backend\\repositories\\database.js:12:3)';
  const error = new TypeError('SQL contains private-token', {cause});
  error.stack = 'TypeError: private-token\n    at handler (file:///private-user/project/src/backend/server.js:25:4)\n    at private-password (private-token)';
  error.password = 'private-password';
  return error;
}

test('internal error diagnostics retain safe stack and cause without sensitive values',()=>{
  const lines=[], log=createLogger({write:line=>lines.push(line)});
  log('error','request completed',{requestId:'reference',error:incident(),body:{password:'private-password'}});
  const detail=JSON.parse(lines[0]).error;
  assert.equal(detail.type,'TypeError');
  assert.deepEqual(detail.stack,['src/backend/server.js:25:4']);
  assert.equal(detail.cause.type,'Error');
  assert.equal(detail.cause.code,'EIO');
  assert.deepEqual(detail.cause.stack,['src/backend/repositories/database.js:12:3']);
  for(const value of ['private-password','private-token','customer@example.com','private-user','SQL']) assert.ok(!lines[0].includes(value));
  const circular = new Error('sensitive'); circular.cause=circular;
  assert.equal(errorDetails(circular).cause.type,'TruncatedCause');
  assert.deepEqual(errorDetails('sensitive'),{type:'NonErrorThrown'});
});

test('HTTP 500 logs once and returns safe body with matching requestId',async t=>{
  const lines=[], log=createLogger({write:line=>lines.push(line)});
  let error=incident();
  const service={repo:{db:{prepare(){throw error;}}}};
  const app=createApp(service,{log,password:'test-only'});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>app.close(resolve)));
  const url=`http://127.0.0.1:${app.address().port}/api/health`;
  for(const failure of [incident(),new AppError('AUTH_NOT_CONFIGURED','private-password',{token:'private-token'})]) {
    error=failure;
    const response=await fetch(url), body=await response.json();
    assert.equal(response.status,failure instanceof AppError ? 503 : 500);
    assert.match(body.requestId,/^[a-f0-9-]{36}$/);
    assert.equal(body.requestId,response.headers.get('x-request-id'));
    assert.deepEqual(body,{error:'INTERNAL_ERROR',message:'Hệ thống gặp sự cố. Vui lòng thử lại.',fields:{},requestId:body.requestId});
    const entry=JSON.parse(lines.at(-1));
    assert.equal(entry.requestId,body.requestId);
    assert.equal(entry.level,'error');
    assert.ok(entry.error.type);
    assert.ok(!JSON.stringify(body).includes('private-'));
  }
  assert.equal(lines.length,2);
  assert.equal(JSON.parse(lines[0]).error.cause.code,'EIO');
});

test('frontend exposes requestId in user-visible message for JSON and proxy 500 errors',async t=>{
  const originalFetch=globalThis.fetch, originalStorage=globalThis.sessionStorage;
  t.after(()=>{globalThis.fetch=originalFetch; if(originalStorage===undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage=originalStorage;});
  globalThis.sessionStorage={getItem:()=>null};
  const id='12345678-1234-1234-1234-123456789abc';
  for(const body of [JSON.stringify({message:'private-password',requestId:id,stack:'private-token',fields:{secret:'private'}}),'<html>private-token</html>']) {
    globalThis.fetch=async()=>new Response(body,{status:500,headers:{'X-Request-Id':id}});
    await assert.rejects(request('/health'),error=>{
      assert.equal(error.requestId,id);
      assert.ok(error.message.includes(`Mã tra cứu: ${id}`));
      assert.ok(!error.message.includes('private-'));
      assert.deepEqual(error.fields,{});
      return true;
    });
  }
});
