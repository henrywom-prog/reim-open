/** REIM off-plan cash flow extension v0.1.1, discrete annual cash flows, no dependencies. */
export function validateOffplan(p){
 const errs=[];const n=(key)=>Number(p[key]);
 if(!p || typeof p!=='object')return ['Input required'];
 for(const key of ['purchasePrice','purchaseCostsPct','saleCostsPct','rentalStartYear','purchaseYear','exitYear','longRent','vacancyPct','managementPct','serviceCharge','maintenance','otherAnnualCosts','furnishOnHandover','rentGrowthPct','costGrowthPct','appreciationPct'])if(!Number.isFinite(n(key)))errs.push(`Invalid ${key}`);
 if(n('purchasePrice')<=0)errs.push('Purchase price must be >0');
 if(n('exitYear')<=n('purchaseYear')||n('rentalStartYear')<=n('purchaseYear')||n('rentalStartYear')>n('exitYear'))errs.push('Bad year sequence');
 if(n('vacancyPct')<0||n('vacancyPct')>100||n('managementPct')<0||n('managementPct')>100)errs.push('Bad percentage');
 const plan=p.paymentShares;if(!Array.isArray(plan)||plan.length<1||Math.abs(plan.reduce((s,x)=>s+Number(x.share),0)-1)>1e-6)errs.push('Payment shares must total 1');
 if(Array.isArray(plan))for(const x of plan){if(!Number.isInteger(x.year)||x.year<n('purchaseYear')||x.year>n('exitYear')||!(x.share>=0))errs.push('Bad installment');}
 return errs;
}
export function xnpv(cashflows, annualRate){return cashflows.reduce((a,b,i)=>a+b/(1+annualRate)**i,0)}
export function irr(flows){
 if(!flows.some(x=>x<0)||!flows.some(x=>x>0))return null;
 let lo=-.99,hi=1;let flo=xnpv(flows,lo),fhi=xnpv(flows,hi);
 while(flo*fhi>0&&hi<1e6){hi=hi*2+1;fhi=xnpv(flows,hi);}
 if(flo*fhi>0)return null;
 for(let i=0;i<140;i++){const m=(lo+hi)/2,v=xnpv(flows,m);if(flo*v>0){lo=m;flo=v}else{hi=m;fhi=v}}
 return (lo+hi)/2;
}
export function evaluateOffplan(p,{rent=p.longRent,appreciation=p.appreciationPct}={}){
 const errs=validateOffplan(p);if(errs.length)throw new Error(errs.join('; '));
 const pr=p.purchasePrice;const details=[];const cf=[];
 for(let yr=p.purchaseYear;yr<=p.exitYear;yr++){
  const tranche=pr*p.paymentShares.filter(x=>x.year===yr).reduce((s,x)=>s+x.share,0);
  const buy=yr===p.purchaseYear?pr*p.purchaseCostsPct/100:0;
  const furnish=yr===p.rentalStartYear-1?p.furnishOnHandover:0;
  let rentGross=0,netOperating=0;
  if(yr>=p.rentalStartYear){
   const k=yr-p.rentalStartYear;
   rentGross=rent*(1+p.rentGrowthPct/100)**k;
   const collected=rentGross*(1-p.vacancyPct/100);
   const manager=collected*p.managementPct/100;
   const fixed=(p.serviceCharge+p.maintenance+p.otherAnnualCosts)*(1+p.costGrowthPct/100)**k;
   netOperating=collected-manager-fixed;
  }
  const terminal=yr===p.exitYear?pr*(1+appreciation/100)**(p.exitYear-p.purchaseYear):0;
  const saleNet=terminal*(1-p.saleCostsPct/100);
  const net=-tranche-buy-furnish+netOperating+saleNet;
  cf.push(net);
  details.push({year:yr,tranche,buy,furnish,rentGross,netOperating,terminal,saleNet,net});
 }
 return {irrPct:irr(cf)*100,flows:cf,details,firstNet:details.find(x=>x.year===p.rentalStartYear)?.netOperating||0,firstGross:rent,netYieldAtPricePct:details.find(x=>x.year===p.rentalStartYear).netOperating/pr*100,netProfit:cf.reduce((a,b)=>a+b,0),terminalPrice:details.at(-1).terminal,amountInvested:details.reduce((a,x)=>a+x.tranche+x.buy+x.furnish,0)};
}
export function findRent(p,targetPct,g=p.appreciationPct){
 let lo=0,hi=2e6; for(let i=0;i<100;i++){let m=(lo+hi)/2;if(evaluateOffplan(p,{rent:m,appreciation:g}).irrPct<targetPct)lo=m;else hi=m;}return(lo+hi)/2;
}
export function findGrowth(p,targetPct,r=p.longRent){
 let lo=-10,hi=20;for(let i=0;i<110;i++){let m=(lo+hi)/2;if(evaluateOffplan(p,{rent:r,appreciation:m}).irrPct<targetPct)lo=m;else hi=m;}return(lo+hi)/2;
}
export function benchmark(p,rate){return {rate,requiredRent:findRent(p,rate),requiredAppreciation:findGrowth(p,rate)}}
