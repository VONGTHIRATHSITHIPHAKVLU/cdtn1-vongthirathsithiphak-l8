import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Each invocation of node:test builds fresh fixtures. No application .env is loaded.
const selected=process.argv[2];
if (selected && !/^TC-(0[1-9]|1[0-2])$/.test(selected)) throw new Error('Use TC-01 through TC-12');
const ids=selected ? [selected] : Array.from({length:12},(_,i)=>`TC-${String(i+1).padStart(2,'0')}`);
// Every run gets a new folder; historical evidence is never overwritten.
mkdirSync('docs/testing/evidence',{recursive:true});
const runDirectory=join('docs/testing/evidence',`run-${new Date().toISOString().replace(/[:.]/g,'-')}-${process.pid}`);
mkdirSync(runDirectory);
console.log(`Evidence directory: ${runDirectory}`);
const results=[];
for (const id of ids) {
  const file=id==='TC-11' ? 'tests/buoi14-bug01.test.js' : id==='TC-12' ? 'tests/buoi14-bug02.test.js' : 'tests/buoi14.test.js';
  const supplemental=['TC-04','TC-05'].includes(id);
  const pattern=supplemental ? `^(?:${id} |HTTP-${id.slice(-2)} )` : `^${id} `;
  const args=['--test',`--test-name-pattern=${pattern}`,file,...(supplemental ? ['tests/buoi14-http-validation.test.js'] : [])];
  const started=new Date().toISOString();
  const result=spawnSync(process.execPath,args,{encoding:'utf8'});
  const output=`Command: node ${args.join(' ')}\nStarted UTC: ${started}\nExit: ${result.status}\n${result.stdout || ''}${result.stderr || ''}${result.error || ''}`;
  writeFileSync(join(runDirectory,`${id}.txt`),output,{flag:'wx'});
  process.stdout.write(output);
  results.push({id,started,exit:result.status});
}
writeFileSync(join(runDirectory,'cases.json'),JSON.stringify(results,null,2)+'\n',{flag:'wx'});
if(results.some(r=>r.exit!==0)) process.exitCode=1;
