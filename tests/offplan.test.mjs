import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {evaluateOffplan,findRent,findGrowth,validateOffplan} from '../skills/reim/scripts/offplan-engine.mjs';
const p=JSON.parse(await readFile(new URL('../skills/reim/assets/examples/yas-living-2br-maid-offplan.json',import.meta.url),'utf8'));
test('off-plan valid input',()=>assert.deepEqual(validateOffplan(p),[]));
test('no rent until rental start',()=>assert.equal(evaluateOffplan(p).details.filter(x=>x.year<2029).reduce((a,x)=>a+x.rentGross,0),0));
test('annual cashflow accounting',()=>{const e=evaluateOffplan(p);assert.equal(e.flows.length,11);assert.equal(e.firstNet,143000);assert.ok(Math.abs(e.irrPct-4.26)<.015)});
test('price split preserves nominal initial costs and rent',()=>{const x={...p,paymentShares:[{year:2026,share:.35},{year:2027,share:.3},{year:2028,share:.35}]};const e=evaluateOffplan(x);assert.ok(e.irrPct>evaluateOffplan(p).irrPct);assert.ok(Math.abs(e.amountInvested-evaluateOffplan(p).amountInvested)<.0001)});
test('benchmark inverse rent and appreciation',()=>{let r=findRent(p,5.21),g=findGrowth(p,5.21);assert.ok(Math.abs(r-252815)<10);assert.ok(Math.abs(g-3.12)<.02);assert.ok(Math.abs(evaluateOffplan(p,{rent:r}).irrPct-5.21)<1e-7)});
test('declining price and rent reduce investment return',()=>{assert.ok(evaluateOffplan(p,{rent:160000,appreciation:0}).irrPct<evaluateOffplan(p).irrPct)});
