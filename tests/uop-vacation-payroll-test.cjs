/** Isolated payroll integration test for Scope 5. Selected snapshot omits full app dependencies. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module,filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}
).outputText,filename);
const orig=Module._load;
function overlaps(date,ranges){return ranges.some(r=> date>=r.start && date<=r.end);}
function days(year,monthIndex,holidays=[],l4=[],leave=[],start=null,end=null){
 let count=0,max=new Date(Date.UTC(year,monthIndex+1,0)).getUTCDate();
 for(let d=1;d<=max;d++){
  const day=new Date(Date.UTC(year,monthIndex,d));const iso=day.toISOString().slice(0,10);
  if(day.getUTCDay()===0 || day.getUTCDay()===6 || (start&&iso<start) || (end&&iso>end) || overlaps(iso,holidays) || overlaps(iso,l4) || overlaps(iso,leave)) continue;
  count++;
 }return count;
}
Module._load=function(name,parent){
 if ((name==='../utils/workingTimeHelper' || name==='./workingTimeHelper') && parent?.filename.includes('/utils/')) {
  return {getWorkedDaysInMonthWithPolishHolidays:days,getWorkingHoursOutsideEmploymentPeriod:()=>0};
 }
 if (name==='../utils/monthHelperFunc' && parent?.filename.endsWith('/workTypeSalaryCalc.ts')) {
  return {countDaysWithinPeriod:(ranges, start, end)=>ranges.reduce((a,r)=>{
    let n=0;const b=new Date(r.start+'T00:00:00Z'),e=new Date(r.end+'T00:00:00Z');
    for(let t=b;t<=e;t=new Date(t.getTime()+86400000)){let iso=t.toISOString().slice(0,10);if((!start||iso>=start)&&(!end||iso<=end)) n++}return a+n;
  },0)};
 }
 return orig.apply(this,arguments);
};
const {calculateTaxesUoP,taxes}=require('../src/utils/workTypeSalaryCalc.ts');
const base=()=>({
 year:2026,month:10,workRateType:'uop_monthly',rate:6000,workingHours:176,
 holidays:[],leave:[],l4:[],leaveBase:6000,l4Base:6000,l4BaseAfterTermination:0,
 employmentStartDate:'2026-10-01',employmentEndDate:'2026-10-31',
 dailyOvertime:0,weekendHolidayOvertime:0,nightOvertime:0,nightHours:0,
 turnOfDayHours:0,overtimeLimit:0,functionalAllowance:0,functionalAllowanceRetainedDuringSickness:false,
 bonuses:[],sicknessBenefitEligible:true,isUnder26:false,isStudent:false,
 previousPensionDisabilityBase:0,previousEmployerSickPayDays:0,uopEmployerSickPayLimit:33,
 ppkEnabled:false,ppkEmployeeRate:2,ppkEmployerRate:1.5,ppkEmployerTaxableContribution:0,
 pit0Relief:'none',pit2MonthlyReduction:300,previousTaxableIncome:0,previousPit0Revenue:0,
 previousUopKupUsed:0,uopKup:250,doNotWithholdPitAdvance:false,
 deductionAfterTax:0,additionAfterTax:0,
});
const vacation=[{start:'2026-10-12',end:'2026-10-16'}];
test('2026 engine year remains v1 payroll target',()=>assert.equal(taxes.year,2026));
test('fixed monthly wage with equal vacation base is invariant',()=>{
 const normal=calculateTaxesUoP(base());
 const paid=calculateTaxesUoP({...base(),leave:vacation});
 assert.equal(paid.fullSalaryBrutto,normal.fullSalaryBrutto);
 assert.equal(paid.leavePayment,1363.64);
 assert.equal(paid.leaveReduction,1363.64);
});
test('monthly variable holiday portion added to gross exactly once',()=>{
 const normal=calculateTaxesUoP(base());
 const paid=calculateTaxesUoP({...base(),leave:vacation,leaveBase:6660});
 assert.equal(paid.fullSalaryBrutto - normal.fullSalaryBrutto,150);
});
test('hourly wage does not pay worked and vacation hours twice',()=>{
 const data={...base(),workRateType:'uop_hourly',rate:35,leaveBase:6160};
 const normal=calculateTaxesUoP({...data,leave:[]});
 const paid=calculateTaxesUoP({...data,leave:vacation});
 assert.equal(normal.fullSalaryBrutto,paid.fullSalaryBrutto);
 assert.equal(paid.leavePayment,1400);
});
test('weekend-only leave has zero financial effect',()=>{
 const normal=calculateTaxesUoP(base());
 const paid=calculateTaxesUoP({...base(),leave:[{start:'2026-10-17',end:'2026-10-18'}]});
 assert.equal(paid.leavePayment,0);
 assert.equal(paid.fullSalaryBrutto,normal.fullSalaryBrutto);
});
