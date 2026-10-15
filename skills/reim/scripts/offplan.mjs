#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {evaluateOffplan,benchmark,validateOffplan} from './offplan-engine.mjs';
import {buildOffplanReport} from './offplan-report.mjs';
const [,,command,input,output]=process.argv;
if(!command||!input){console.log('Usage: node scripts/offplan.mjs validate|analyze|report INPUT.json [OUTPUT.html]');process.exit(command?1:0)}
try{
 const p=JSON.parse(await readFile(input,'utf8'));
 const errors=validateOffplan(p);if(errors.length)throw Error(errors.join('; '));
 if(command==='validate')console.log('Valid REIM off-plan input');
 else if(command==='analyze')console.log(JSON.stringify({base:evaluateOffplan(p),benchmarks:p.benchmarks.map(x=>({name:x.name,...benchmark(p,x.rate)}))},null,2));
 else if(command==='report'){
  if(!output)throw Error('Missing OUTPUT.html');
  await writeFile(output,buildOffplanReport(p),'utf8');console.log('Wrote '+output);
 } else throw Error('Unknown command');
}catch(e){console.error(e.message);process.exit(1)}
