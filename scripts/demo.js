import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepareDemoEnv } from './demo-env.js';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  prepareDemoEnv(resolve(root, '.env'));
  console.log('Local demo configuration ready. Credentials are in .env (not printed).');
  const result = spawnSync('docker', ['compose', 'up', '--build', '-d', '--wait', '--wait-timeout', '180'], {
    cwd: root, stdio: 'inherit',
  });
  if (result.error || result.status !== 0) {
    console.error('Deployment did not complete. Check Docker access/daemon, available ports and the Deployment Guide.');
    process.exitCode = result.status || 1;
  } else {
    console.log('Compose health checks passed. Open http://127.0.0.1:8080 (or WEB_PORT from your configuration).');
    console.log('Sign in as demo using DEMO_PASSWORD from the local .env file. Do not include it in logs or screenshots.');
  }
} catch {
  console.error('Could not prepare local configuration. Check .env syntax and filesystem permissions.');
  process.exitCode = 1;
}
