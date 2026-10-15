#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {evaluate,compare,validate,VERSION} from '../docs/engine.mjs';
import {buildReport} from '../docs/report.mjs';
const [, ,command, input, output]=process.argv;
const help=`REIM ${VERSION}\nUsage:\n  node bin/reim.mjs report examples/ansam-1.json output/report.html\n  node bin/reim.mjs analyze examples/ansam-1.json\n  node bin/reim.mjs validate examples/ansam-1.json\n`;
if(!command||['help','--help','-h'].includes(command)){console.log(help);process.exit(0)}
try{
 if(!input)throw Error('Provide input JSON file.\n'+help);
 const data=JSON.parse(await readFile(resolve(input),'utf8'));
 const errors=validate(data);if(errors.length)throw Error(errors.join('\n'));
 if(command==='validate'){console.log('REIM input valid');process.exit(0)}
 if(command==='analyze'){
   const all=compare(data); console.log(JSON.stringify({version:VERSION,project:data.project,base:{short:{irrPct:all.base.short.irrPct,netYieldPct:all.base.short.netYieldPct,netIncome:all.base.short.first.net},long:{irrPct:all.base.long.irrPct,netYieldPct:all.base.long.netYieldPct,netIncome:all.base.long.first.net}},scenarios:Object.fromEntries(Object.entries(all).map(([k,v])=>[k,{shortIrrPct:v.short.irrPct,longIrrPct:v.long.irrPct}]))},null,2));
 }else if(command==='report'){
   if(!output)throw Error('Provide an output HTML path');
   const path=resolve(output);await mkdir(dirname(path),{recursive:true});await writeFile(path,buildReport(data,data.language),'utf8');console.log('Report created: '+path);
 }else throw Error('Unknown command: '+command+'\n'+help);
}catch(e){console.error('REIM error:',e.message);process.exit(1)}
