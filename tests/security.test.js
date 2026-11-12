import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { passwordVerifier, sessionKey } from '../src/backend/auth.js';
import { apiRouter } from '../src/backend/routes/api.js';
import { createApp } from '../src/backend/server.js';
import { createLogger } from '../src/backend/logger.js';

test('salted password verifier accepts only the configured credential', () => {
  const password = randomBytes(32).toString('hex');
  const verify = passwordVerifier(password);
  assert.equal(verify(password), true);
  assert.equal(verify(randomBytes(32).toString('hex')), false);
  assert.equal(verify(null), false);
  assert.equal(verify('x'.repeat(16385)), false);
  assert.equal(passwordVerifier(''), null);
  assert.match(sessionKey(password), /^[a-f0-9]{64}$/);
  assert.notEqual(sessionKey(password), password);
});

test('session identity controls audit actor; bare, altered and logged-out tokens are rejected', () => {
  const password = randomBytes(32).toString('hex');
  const service = { saveTemplate: (body, actor) => ({ actor }) };
  const route = apiRouter(service, { password });
  const [, login] = route('POST', '/api/auth/login', { username:'demo', password });
  const token = login.token;
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.throws(() => route('POST', '/api/survey-templates', {}, token), { code:'UNAUTHORIZED' });
  assert.throws(() => route('POST', '/api/survey-templates', {}, `Bearer ${token}x`), { code:'UNAUTHORIZED' });
  assert.throws(() => route('POST', '/api/survey-templates', {}, `Bearer ${randomBytes(32).toString('hex')}`), { code:'UNAUTHORIZED' });
  assert.deepEqual(route('POST', '/api/survey-templates', { actor:999, userId:999, role:'ADMIN' }, `Bearer ${token}`), [201, { actor:1 }]);
  route('POST', '/api/auth/logout', {}, `Bearer ${token}`);
  assert.throws(() => route('POST', '/api/survey-templates', {}, `Bearer ${token}`), { code:'UNAUTHORIZED' });
});

test('HTTP errors and logs exclude credentials, customer URL segments and internal error text', async t => {
  const password = randomBytes(32).toString('hex');
  const marker = randomBytes(24).toString('hex');
  const lines = [];
  const app = createApp({ templates:() => { throw new Error(marker); } }, {
    password, log:createLogger({ write:line => lines.push(line) }),
  });
  app.listen(0, '127.0.0.1'); await once(app, 'listening');
  t.after(() => new Promise(resolve => app.close(resolve)));
  const base = `http://127.0.0.1:${app.address().port}`;
  const login = await fetch(base+'/api/auth/login', { method:'POST', body:JSON.stringify({ username:'demo', password }) });
  const { token } = await login.json();
  const response = await fetch(base+'/api/survey-templates', { headers:{ Authorization:`Bearer ${token}` } });
  assert.equal(response.status, 500);
  const error = await response.json();
  assert.equal(error.error, 'INTERNAL_ERROR');
  assert.ok(error.requestId);
  assert.ok(!JSON.stringify(error).includes(marker));
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  await fetch(base+'/api/customer/private-customer-name?password='+marker);
  const output = lines.join('');
  for (const sensitive of [password, token, marker, 'private-customer-name']) assert.ok(!output.includes(sensitive));
  assert.ok(lines.map(line => JSON.parse(line)).some(line => line.route === 'other'));
});
