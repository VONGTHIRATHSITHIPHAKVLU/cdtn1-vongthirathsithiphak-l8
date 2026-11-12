import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

// Heuristic audit, not a guarantee. Output locations/rules only, NEVER matches.
const root = fileURLToPath(new URL('../', import.meta.url));
function git(args, input) {
  const result = spawnSync('git', args, { cwd:root, input, maxBuffer:256*1024*1024 });
  if (result.status !== 0 || result.error) throw new Error('Git audit operation failed');
  return result.stdout;
}
const rules = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['provider-token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{24,})\b/g],
  ['jwt-token', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
  ['credential-url', /[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/gi],
  ['literal-credential', /\b(?:password|passwd|secret|api_key|jwt_secret|demo_password|token)\b["']?\s*[:=]\s*["']([^"'\r\n]{4,256})["']/gi],
  ['environment-credential', /^[ \t]*(?:[A-Z_]*(?:PASSWORD|SECRET|API_KEY|ACCESS_TOKEN))[ \t]*=[ \t]*([^\s#]{4,})/gm],
];
const envPath = resolve(root, '.env');
const localCredential = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')).DEMO_PASSWORD : undefined;
const findings = [], counts = { worktreeTextFiles:0, historyTextBlobs:0, historyMetadataObjects:0, binaryFilesOrBlobs:0 };
function inspect(buffer, location) {
  const utf16 = buffer[0] === 0xff && buffer[1] === 0xfe;
  if (!utf16 && buffer.includes(0)) { counts.binaryFilesOrBlobs++; return; }
  const text = utf16 ? buffer.subarray(2).toString('utf16le') : buffer.toString('utf8');
  counts[location.scope === 'history' ? 'historyTextBlobs' : location.scope === 'history-metadata' ? 'historyMetadataObjects' : 'worktreeTextFiles']++;
  for (const [rule, regex] of rules) {
    regex.lastIndex = 0;
    for (const match of text.matchAll(regex)) {
      findings.push({ ...location, line:text.slice(0,match.index).split('\n').length, rule });
    }
  }
  if (localCredential && text.includes(localCredential)) findings.push({ ...location, rule:'current-local-credential', line:null });
}
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes:true })) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      if (['.git','node_modules','dist','.cache','coverage'].includes(entry.name) || entry.name.startsWith('.tmp')) continue;
      walk(resolve(directory,entry.name));
    } else if (entry.isFile()) {
      // Local provisioning files are intentionally secret, not repository source.
      if (entry.name === '.env' || (entry.name.startsWith('.env.') && entry.name !== '.env.example')) continue;
      const path = resolve(directory,entry.name);
      inspect(readFileSync(path), { scope:'worktree', path:relative(root,path).replaceAll('\\','/') });
    }
  }
}
try {
  walk(root);
  const objects = git(['rev-list','--objects','--all']).toString('utf8').trim().split('\n').map(line => {
    const space=line.indexOf(' ');
    return { oid:space < 0 ? line : line.slice(0,space), path:space < 0 ? null : line.slice(space+1) };
  });
  // One representative path per unique object; all reachable branches/tags scanned.
  const batch = git(['cat-file','--batch'], objects.map(item=>item.oid).join('\n')+'\n');
  let offset=0;
  for (const object of objects) {
    const end=batch.indexOf(10,offset), header=batch.subarray(offset,end).toString('utf8').split(' ');
    const size=Number(header[2]);
    if (!Number.isSafeInteger(size)) throw new Error('Invalid Git object response');
    offset=end+1;
    if (header[1] === 'blob') inspect(batch.subarray(offset,offset+size), { scope:'history', oid:object.oid, path:object.path });
    if (['commit','tag'].includes(header[1])) inspect(batch.subarray(offset,offset+size), { scope:'history-metadata', oid:object.oid, path:null });
    offset+=size+1;
  }
  const envHistory=git(['log','--all','--format=','--name-only','--','.env',':(glob)**/.env',':(glob)**/.env.*']).toString('utf8').split('\n').filter(path=>path && !path.endsWith('.env.example'));
  console.log(JSON.stringify({ scannedUTC:new Date().toISOString(), scope:'Current worktree including untracked files; all unique blobs reachable from local Git refs. No remote fetch, dangling/unreachable objects or external copies.', exclusions:'Dependencies, build output, .git worktree traversal, caches, temporary directories, symlinks and local .env provisioning files. Binary blobs counted but not text-scanned.', counts, historicalEnvPaths:[...new Set(envHistory)], findings, verdict:'REQUIRES_TRIAGE: heuristic candidates are not proof of a real secret, and zero candidates would not prove absence.' }, null, 2));
} catch {
  console.error('Secret scan incomplete. No secret values were printed.');
  process.exitCode=1;
}
