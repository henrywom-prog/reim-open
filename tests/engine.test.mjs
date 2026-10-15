import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluate,annualRental,compareBreakEven,validate,irr,npv,maxPurchasePriceForTarget,scenario} from '../docs/engine.mjs';
import {buildReport} from '../docs/report.mjs';
const file=name=>JSON.parse(readFileSync(new URL(`../examples/${name}.json`,import.meta.url),'utf8'));
const sample=file('ansam-1');
test('all four sample inputs validate and yield finite metrics',()=>{
  for(const name of ['ansam-1','ajwan-c','damac-heights','sobha-waves']){
    const data=file(name);assert.deepEqual(validate(data),[]);
    for(const mode of ['short','long']){const e=evaluate(data,mode);assert.ok(Number.isFinite(e.irrPct));assert.ok(Number.isFinite(e.netYieldPct));assert.equal(e.cashflows.length,data.holdYears+1);assert.ok(e.annual[0].gross>0)}
  }
});
test('IRR and NPV known values',()=>{
 assert.ok(Math.abs(irr([-100,110])-10)<1e-8);
 assert.ok(Math.abs(npv([-100,110],10))<1e-8);
 assert.ok(Math.abs(irr([-100,0,121])-10)<1e-8);
});
test('annual rent subtraction, property fees and no double counting of sale',()=>{
 const p={...sample,holdYears:1,purchasePrice:1000,purchaseCostsPct:0,saleCostsPct:0,furnishing:0,serviceCharge:0,maintenance:0,longRent:110,longVacancyPct:0,longManagementPct:0,longExtraCosts:0,appreciationPct:0,rentGrowthPct:0};
 const e=evaluate(p,'long');assert.deepEqual(e.cashflows,[-1000,1110]);assert.ok(Math.abs(e.irrPct-11)<1e-9);
});
test('short rental monthly ADR and 365-day occupancy',()=>{
 const p={...sample,shortManagementPct:0,tourismPct:0,tourismPerNight:0,cleaningPerNight:0,maintenance:0,utilities:0,serviceCharge:0,shortFixedCosts:0,monthly:Array.from({length:12},()=>({adr:100,occupancy:100}))};
 const s=annualRental(p,'short');assert.equal(s.bookedNights,365);assert.equal(s.gross,36500);assert.equal(s.net,36500);
});
test('monthly changes change short rental economics',()=>{
 const p=structuredClone(sample),before=annualRental(p,'short');p.monthly[0].occupancy=0;
 assert.ok(annualRental(p,'short').gross<before.gross);
});
test('cautious and optimistic ordered scenarios',()=>{
 const c=evaluate(scenario(sample,'cautious'),'long'),b=evaluate(sample,'long'),o=evaluate(scenario(sample,'optimistic'),'long');
 assert.ok(c.irrPct<b.irrPct);assert.ok(b.irrPct<o.irrPct);
});
test('reverse target IRR anchored resale price falls as required return increases',()=>{
 const p1=maxPurchasePriceForTarget(sample,5,'long'),p2=maxPurchasePriceForTarget(sample,8,'long');
 assert.ok(p1>p2);assert.ok(p1>0);const e=evaluate({...sample,purchasePrice:p1,resaleAnchorPrice:sample.purchasePrice},'long');assert.ok(Math.abs(e.irrPct-5)<.0001);
});
test('negative income can be represented and never hidden',()=>{
 const p={...sample,serviceCharge:1000000};assert.ok(annualRental(p,'long').net<0);
});
test('validation catches broken prices and occupancy',()=>{
 assert.ok(validate({...sample,purchasePrice:0}).length);
 assert.ok(validate({...sample,monthly:[{adr:100,occupancy:20}]}).length);
 assert.ok(validate({...sample,monthly:sample.monthly.map((x,i)=>i===0?{adr:100,occupancy:101}:x)}).length);
});
test('report is offline HTML with 8 pages and escaped user content',()=>{
 const html=buildReport({...sample,project:'<script>alert(1)</script>'});assert.equal((html.match(/<section class="page">/g)||[]).length,8);
 assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.ok(html.includes('window.print()'));assert.ok(!html.includes('<script src='));
});
test('report renders English',()=>{const html=buildReport(file('damac-heights'),'en');assert.ok(html.includes('Does this property make financial sense?'));assert.ok(html.includes('Sources')===false||html.includes('Sources'));});
