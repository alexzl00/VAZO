/** Audit-only reproduction of proposed article examples against the provided V1 calculation functions.
 * Calendar is a mocked standard Monday-Friday calendar; this is not an end-to-end holiday verification.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const Module = require('node:module');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
 fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }
).outputText, filename);
const origLoad = Module._load;
const overlaps = (iso, rs=[]) => rs.some(r => iso >= r.start && iso <= r.end);
const days = (year, monthIndex, holidays=[], l4=[], leave=[], periodStart, periodEnd) => {
 let count=0;
 for(let d=1,max=new Date(Date.UTC(year, monthIndex+1, 0)).getUTCDate();d<=max;d++){
  const date = new Date(Date.UTC(year,monthIndex,d));
  const iso=date.toISOString().slice(0,10);
  if(date.getUTCDay()===0 || date.getUTCDay()===6 || (periodStart&&iso<periodStart) || (periodEnd&&iso>periodEnd) || overlaps(iso,holidays) || overlaps(iso,l4) || overlaps(iso,leave)) continue;
  count++;
 }
 return count;
};
Module._load=function(name,parent,isMain){
 if ((name==='../utils/workingTimeHelper' || name==='./workingTimeHelper') && parent?.filename.includes('/src/utils/')) return {getWorkedDaysInMonthWithPolishHolidays:days,getWorkingHoursOutsideEmploymentPeriod:()=>0};
 if (name==='../utils/monthHelperFunc' && parent?.filename.endsWith('/workTypeSalaryCalc.ts')) return {countDaysWithinPeriod:(ranges,start,end)=>ranges.reduce((total,range)=>{
  for(let date=new Date(`${range.start}T00:00:00Z`),limit=new Date(`${range.end}T00:00:00Z`);date<=limit;date=new Date(+date+86400000)){
   const iso=date.toISOString().slice(0,10);if((!start||iso>=start)&&(!end||iso<=end))total++;
  }
  return total;
 },0)};
 return origLoad.apply(this, arguments);
};
const { calculateTaxesUoP } = require('../src/utils/workTypeSalaryCalc.ts');
const { calculateUopVacationBase } = require('../src/utils/calculateUopVacationBase.ts');
const base = () => ({
 year:2026,month:10,workRateType:'uop_monthly',rate:6000,workingHours:176,
 holidays:[],leave:[],l4:[],leaveBase:6000,l4Base:5177.40,l4BaseAfterTermination:0,
 employmentStartDate:'2026-10-01',employmentEndDate:'2026-10-31',
 dailyOvertime:0,weekendHolidayOvertime:0,nightOvertime:0,nightHours:0,turnOfDayHours:0,
 overtimeLimit:0,functionalAllowance:0,functionalAllowanceRetainedDuringSickness:false,bonuses:[],
 sicknessBenefitEligible:true,isUnder26:false,isStudent:false,
 previousPensionDisabilityBase:0,previousEmployerSickPayDays:0,uopEmployerSickPayLimit:33,
 ppkEnabled:false,ppkEmployeeRate:2,ppkEmployerRate:1.5,ppkEmployerTaxableContribution:0,
 pit0Relief:'none',pit2MonthlyReduction:300,previousTaxableIncome:0,previousPit0Revenue:0,
 previousUopKupUsed:0,uopKup:250,doNotWithholdPitAdvance:false,deductionAfterTax:0,additionAfterTax:0
});
test('L4 base worked example 6000 * (1 - 13.71%)', () => assert.equal(Math.round(6000*0.8629*100)/100,5177.40));
test('6 calendar days ordinary sickness benefit: 828.36 gross',()=>{
 const r = calculateTaxesUoP({...base(),l4:[{start:'2026-10-12',end:'2026-10-17',paymentType:'standard80'}]});
 assert.equal(r.employerSickPay,828.36);
 assert.equal(r.employerSickPayDays,6);
 assert.equal(r.sicknessBenefit,0);
});
test('Vacation variable addition in two-day leave: 48.00 gross',()=>{
 const month=(n,amount)=>({salaryId:`m${n}`,year:2026,month:n,paymentMode:'monthly',employmentStartDate:'2026-01-01',employmentEndDate:'2026-12-31',workingHours:160,rate:6000,calculationSettings:{},dailyOvertime:0,weekendHolidayOvertime:0,nightOvertime:0,nightHours:0,turnOfDayHours:0,holidays:[],l4:[],leave:[],bonuses:[{id:`bonus${n}`,name:'Premia',amount,frequency:'monthly',paymentType:'cash',vacationTreatment:'variableBase'}]});
 const leave=[{start:'2026-10-12',end:'2026-10-13'}];
 const v=calculateUopVacationBase({
  history:{relation:{id:'r1',startDate:'2026-01-01',endDate:null,paymentMode:'monthly'},months:[month(7,600),month(8,480),month(9,360)],missingPeriods:[],historyStart:'2026-01-01',historyEnd:'2026-09-30'},
  target:{year:2026,month:10,workRateType:'uop_monthly',rate:6000,workingHours:176,leave,l4:[],holidays:[],employmentStartDate:'2026-01-01',employmentEndDate:null,vacationBaseMonths:3}
 });
 assert.equal(v.variableGrossTotal,1440);
 assert.equal(v.actualHoursTotal,480);
 assert.equal(v.leaveHours,16);
 assert.equal(v.variableHourlyRate,3);
 const normal=calculateTaxesUoP(base());
 const actual=calculateTaxesUoP({...base(),leave,leaveBase:v.monthlyBase});
 assert.equal(Math.round((actual.fullSalaryBrutto-normal.fullSalaryBrutto)*100)/100,48);
});
