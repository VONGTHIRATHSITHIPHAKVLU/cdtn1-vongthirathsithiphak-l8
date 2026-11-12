import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { prepareDemoEnv } from '../scripts/demo-env.js';

test('demo credentials are random, stable across reruns and preserve existing settings', t => {
  const dir = mkdtempSync(join(tmpdir(), 'smartcrm-demo-env-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const first = join(dir, 'first.env'), second = join(dir, 'second.env');
  prepareDemoEnv(first); prepareDemoEnv(second);
  const content = readFileSync(first, 'utf8');
  const password = parseEnv(content).DEMO_PASSWORD;
  assert.match(password, /^[a-f0-9]{64}$/);
  assert.notEqual(password, parseEnv(readFileSync(second, 'utf8')).DEMO_PASSWORD);
  prepareDemoEnv(first);
  assert.equal(readFileSync(first, 'utf8'), content);
  writeFileSync(second, 'WEB_PORT=8099\nDEMO_PASSWORD=\n');
  prepareDemoEnv(second);
  assert.equal(parseEnv(readFileSync(second, 'utf8')).WEB_PORT, '8099');
  assert.match(parseEnv(readFileSync(second, 'utf8')).DEMO_PASSWORD, /^[a-f0-9]{64}$/);
});
