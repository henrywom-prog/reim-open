/* REIM deterministic real-estate engine — dependency-free, runs in browsers and Node. */
export const VERSION = '0.1.0';
export const DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];
const num = (value, fallback = 0) => { const n=Number(value); return Number.isFinite(n) ? n : fallback; };
export const clamp = (value, min, max) => Math.max(min, Math.min(max, num(value)));
export const sum = items => items.reduce((a,b)=>a+b,0);
export function validate(p) {
  const errors=[];
  if (!p || typeof p !== 'object') return ['Input must be an object'];
  if (!Number.isFinite(Number(p.purchasePrice)) || Number(p.purchasePrice)<=0) errors.push('purchasePrice must be positive');
  if (!(Number.isInteger(Number(p.holdYears)) && Number(p.holdYears)>=1 && Number(p.holdYears)<=40)) errors.push('holdYears must be integer from 1 to 40');
  for (const key of ['purchaseCostsPct','saleCostsPct','appreciationPct','rentGrowthPct','discountRatePct','benchmarkYieldPct','serviceCharge','maintenance','utilities','furnishing','longRent','longVacancyPct','longManagementPct','shortManagementPct','tourismPct','tourismPerNight','cleaningPerNight','shortFixedCosts']) {
    if (p[key]!==undefined && (!Number.isFinite(Number(p[key])) || (['serviceCharge','maintenance','utilities','furnishing','longRent','tourismPerNight','cleaningPerNight','shortFixedCosts'].includes(key) && Number(p[key])<0))) errors.push(`${key} must be valid`);
  }
  for (const key of ['purchaseCostsPct','saleCostsPct','longVacancyPct','longManagementPct','shortManagementPct','tourismPct']) {
    if(p[key]!==undefined && (Number(p[key])<0||Number(p[key])>100))errors.push(`${key} must be between 0 and 100`);
  }
  if (!Array.isArray(p.monthly) || p.monthly.length!==12) errors.push('monthly must have exactly 12 entries');
  for(const [i,m] of (Array.isArray(p.monthly)?p.monthly:[]).entries()){
    if(!Number.isFinite(Number(m.adr)) || Number(m.adr)<0)errors.push(`monthly[${i}].adr must be >= 0`);
    if(!Number.isFinite(Number(m.occupancy)) || Number(m.occupancy)<0||Number(m.occupancy)>100)errors.push(`monthly[${i}].occupancy must be 0..100`);
  }
  if (p.appreciationPct!==undefined && Number(p.appreciationPct)<=-100) errors.push('appreciationPct must exceed -100');
  if (p.rentGrowthPct!==undefined && Number(p.rentGrowthPct)<=-100) errors.push('rentGrowthPct must exceed -100');
  if (p.discountRatePct!==undefined && Number(p.discountRatePct)<=-100) errors.push('discountRatePct must exceed -100');
  return errors;
}
export function npv(cashflows, annualRatePct) {
  const r=num(annualRatePct)/100;
  if (r<=-1) return null;
  return sum(cashflows.map((f,t)=>f/Math.pow(1+r,t)));
}
export function irr(cashflows) {
  const hasPos=cashflows.some(x=>x>0), hasNeg=cashflows.some(x=>x<0);
  if(!hasPos||!hasNeg)return null;
  const at = r => sum(cashflows.map((f,t)=>f/Math.pow(1+r,t)));
  let low=-0.9999,high=1;
  let lo=at(low), hi=at(high);
  while(hi>0 && high<1e6){high=high*2+1;hi=at(high);}
  if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo*hi>0)return null;
  for(let i=0;i<160;i++){const m=(low+high)/2;const v=at(m);if(Math.abs(v)<1e-12)return m*100; if((v>0)===(lo>0)){low=m;lo=v;}else{high=m;hi=v;}}
  return (low+high)/2*100;
}
const pct = x => num(x)/100;
export function annualRental(p, mode='short', year=1) {
  const growth=Math.pow(1+pct(p.rentGrowthPct),year-1);
  const fees=num(p.serviceCharge)+num(p.maintenance);
  if(mode==='long') {
    const potential=num(p.longRent)*growth;
    const effective=potential*(1-pct(p.longVacancyPct));
    const manager=effective*pct(p.longManagementPct);
    const extras=num(p.longExtraCosts);
    return { gross:effective, potential, expense:fees+manager+extras, net:effective-fees-manager-extras, bookedNights:null, adr:null, items:{serviceCharge:num(p.serviceCharge),maintenance:num(p.maintenance),management:manager,other:extras} };
  }
  const m = p.monthly || DAYS.map(()=>({adr:0,occupancy:0}));
  const bookedNights=sum(m.map((x,i)=>DAYS[i]*pct(x.occupancy)));
  const gross=sum(m.map((x,i)=>DAYS[i]*pct(x.occupancy)*num(x.adr)))*growth;
  const service=num(p.serviceCharge), fixed=num(p.shortFixedCosts), utility=num(p.utilities);
  const manager=gross*pct(p.shortManagementPct), tourism=gross*pct(p.tourismPct)+bookedNights*num(p.tourismPerNight);
  const cleaning=bookedNights*num(p.cleaningPerNight);
  const expense=service+num(p.maintenance)+fixed+utility+manager+tourism+cleaning;
  return {gross,potential:sum(m.map((x,i)=>DAYS[i]*num(x.adr)))*growth, expense,net:gross-expense,bookedNights,adr:bookedNights>0?gross/bookedNights:0,items:{serviceCharge:service,maintenance:num(p.maintenance),fixed,utilities:utility,management:manager,tourism,cleaning}};
}
export function evaluate(raw,mode='short') {
  const errors=validate(raw); if(errors.length) throw new Error(errors.join('; '));
  const p={...raw};const years=num(p.holdYears),price=num(p.purchasePrice);
  const buyFees=price*pct(p.purchaseCostsPct),upfront=price+buyFees+num(p.furnishing);
  const cashflows=[-upfront], annual=[];
  for(let year=1;year<=years;year++){
    const rental=annualRental(p,mode,year), sale=year===years?price*Math.pow(1+pct(p.appreciationPct),years):0;
    const saleFees=sale*pct(p.saleCostsPct);const final=rental.net+sale-saleFees;
    cashflows.push(final);
    annual.push({year,...rental,sale,saleFees,final});
  }
  const first=annual[0], terminalPrice=num(p.resaleAnchorPrice,price)*Math.pow(1+pct(p.appreciationPct),years),totalRent=sum(annual.map(x=>x.net));
  const profit=sum(cashflows);
  return {mode,cashflows,annual,inputs:p,price,upfront,buyFees,terminalPrice,netSale:terminalPrice*(1-pct(p.saleCostsPct)),totalNetRent:totalRent,netProfit:profit,roiPct:profit/upfront*100,irrPct:irr(cashflows),npv:npv(cashflows,p.discountRatePct),first,netYieldPct:first.net/price*100,grossYieldPct:first.gross/price*100,capitalCagrPct:num(p.appreciationPct),benchmarkGapPct:(irr(cashflows)??0)-num(p.benchmarkYieldPct)};
}
export function scenario(base,caseName='base') {
  const p=structuredClone(base);
  if(caseName==='cautious'){
    p.appreciationPct=num(p.appreciationPct)-2;
    p.rentGrowthPct=num(p.rentGrowthPct)-1;
    p.longRent=num(p.longRent)*0.9;
    p.monthly=p.monthly.map(x=>({adr:num(x.adr)*0.9,occupancy:clamp(num(x.occupancy)-10,0,100)}));
  } else if(caseName==='optimistic'){
    p.appreciationPct=num(p.appreciationPct)+2;
    p.rentGrowthPct=num(p.rentGrowthPct)+1;
    p.longRent=num(p.longRent)*1.1;
    p.monthly=p.monthly.map(x=>({adr:num(x.adr)*1.1,occupancy:clamp(num(x.occupancy)+8,0,100)}));
  }
  return p;
}
export function compare(raw) {
  const base=structuredClone(raw);
  const results={};
  for(const type of ['cautious','base','optimistic']){
    const params=scenario(base,type);
    results[type]={short:evaluate(params,'short'),long:evaluate(params,'long')};
  }
  return results;
}
export function annualOccupancy(p){return sum((p.monthly||[]).map((m,i)=>DAYS[i]*pct(m.occupancy)))/365*100;}
export function compareBreakEven(p){
  const long=annualRental(p,'long').net;
  const baseline=annualRental(p,'short');
  const fixed=baseline.items.serviceCharge+baseline.items.maintenance+baseline.items.fixed+baseline.items.utilities;
  const variable=baseline.gross-baseline.items.management-baseline.items.tourism-baseline.items.cleaning;
  return variable<=0?null:annualOccupancy(p)*(long+fixed)/variable;
}
export function maxPurchasePriceForTarget(base, targetIrrPct, mode='long'){
  let low=1,high=num(base.purchasePrice)*10;
  const target=num(targetIrrPct);
  const calc=x=>evaluate({...base,purchasePrice:x,resaleAnchorPrice:num(base.resaleAnchorPrice,base.purchasePrice)},mode).irrPct;
  if(calc(low)===null || calc(high)===null || calc(low)<target || calc(high)>target)return null;
  for(let i=0;i<90;i++){const mid=(low+high)/2; if(calc(mid)>target)low=mid;else high=mid;}
  return (low+high)/2;
}
