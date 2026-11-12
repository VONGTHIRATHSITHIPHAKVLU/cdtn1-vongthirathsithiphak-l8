import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { parseEnv } from 'node:util';

// Never return or print credentials. Preserve existing local configuration.
export function prepareDemoEnv(path) {
  const exists = existsSync(path);
  const current = exists ? readFileSync(path, 'utf8') : '';
  if (parseEnv(current).DEMO_PASSWORD) return;
  const password = randomBytes(32).toString('hex');
  const content = current + '\n# Generated local demo credential; never commit this file.\nDEMO_PASSWORD=' + password + '\n';
  writeFileSync(path, content, { mode: 0o600, flag: exists ? 'w' : 'wx' });
}
