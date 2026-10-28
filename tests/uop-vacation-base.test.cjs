/** Scope 5 pure vacation tests. Run: node --test tests/uop-vacation-base.test.cjs
 * Uses an isolated standard Mon-Fri calendar substitute because the supplied
 * Scope 4 archive omits runtime dependencies and the full app environment.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename,'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(code, filename);
};
const originalLoad = Module._load;
const isWithin = (s, ranges) => ranges.some(r=>s>=r.start && s<=r.end);
Module._load = function(name, parent, isMain) {
  if (name === './workingTimeHelper' && parent?.filename.endsWith('/vacationWorkingTime.ts')) {
    return {
      getWorkedDaysInMonthWithPolishHolidays(year, monthIndex, holidays, l4, leave, start, end) {
        let n=0;
        const max=new Date(Date.UTC(year,monthIndex+1,0)).getUTCDate();
        for(let d=1;d<=max;d++) {
          const date=new Date(Date.UTC(year,monthIndex,d));
          const iso=date.toISOString().slice(0,10);
          if (date.getUTCDay()===0 || date.getUTCDay()===6 ||
            isWithin(iso,holidays) || isWithin(iso,l4) || isWithin(iso,leave) ||
            (start && iso < start) || (end && iso > end)) continue;
          n++;
        }
        return n;
      }
    };
  }
  return originalLoad.apply(this, arguments);
};
const {calculateUopVacationBase,UopVacationBaseError} = require('../src/utils/calculateUopVacationBase.ts');
const {getVacationScheduledHours} = require('../src/utils/vacationWorkingTime.ts');
const period = (month, changes={})=>({
 salaryId:'id'+month,year:2026,month,paymentMode:'monthly',
 employmentStartDate:'2026-01-01',employmentEndDate:'2026-12-31',
 workingHours:160, rate:6000, calculationSettings:{},
 dailyOvertime:0,weekendHolidayOvertime:0,nightOvertime:0,nightHours:0,turnOfDayHours:0,
 holidays:[],l4:[],leave:[],bonuses:[],...changes
});
const bonus = (amount, props={})=>({id:'b',name:'Premia',amount,frequency:'monthly',paymentType:'cash',vacationTreatment:'variableBase',...props});
const target = (overrides={})=>({
 year:2026,month:10,workRateType:'uop_monthly',rate:6000,workingHours:176,
 l4:[],holidays:[],leave:[{start:'2026-10-12',end:'2026-10-16'}], vacationBaseMonths:3,
 employmentStartDate:'2026-10-01', employmentEndDate:'2026-10-31', ...overrides
});
const history = (months, props={})=>({
 relation:{id:'relation',startDate:'2026-01-01',endDate:null,paymentMode:'monthly'},
 months,missingPeriods:[],historyStart:'2025-01-01',historyEnd:'2026-09-01',...props
});
const invoke = (months=[period(7),period(8),period(9)],t={},h={}) => calculateUopVacationBase({
 target: target(t),history:history(months,h)
});
const fails = (callback,id)=>assert.throws(callback,e=>e instanceof UopVacationBaseError && e.id===id);

test('monthly fixed salary: base stays 6000 without variable parts',()=>{
 const value=invoke();assert.equal(value.monthlyBase,6000);assert.equal(value.leaveHours,40);
});
test('variable monthly bonus divided by actual worked hours',()=>{
 const value=invoke([period(7,{bonuses:[bonus(300)]}),period(8,{bonuses:[bonus(600)]}),period(9,{bonuses:[bonus(900)]})]);
 assert.equal(value.actualHoursTotal,480);
 assert.equal(value.variableGrossTotal,1800);
 assert.equal(value.monthlyBase,6660); // 6000 + (1800/480)*176
});
test('excluded and paid-in-full bonuses are not added to historical average',()=>{
 const value=invoke([period(7,{bonuses:[bonus(500,{vacationTreatment:'excluded'}), bonus(250,{id:'p',vacationTreatment:'paidInFull'})]}),period(8),period(9)]);
 assert.equal(value.monthlyBase,6000);
});
test('missing monthly cash classification uses automatic variableBase and reports source',()=>{
 const result=invoke([period(7,{bonuses:[bonus(50,{vacationTreatment:null})]}),period(8),period(9)]);
 assert.equal(result.variableGrossTotal,50);
 assert.ok(result.notes.some(n=>n.id==='vacation-base-note-bonus-auto-included' && n.values.periods==='2026-07'));
});

test('automatic quarterly bonus is excluded instead of raising an error',()=>{
 const result=invoke([period(7,{bonuses:[bonus(500,{frequency:'quarterly',vacationTreatment:null})]}),period(8),period(9)]);
 assert.equal(result.variableGrossTotal,0);
 assert.ok(result.notes.some(n=>n.id==='vacation-base-note-bonus-auto-excluded'));
});

test('automatic nonCash bonus is excluded instead of raising an error',()=>{
 const result=invoke([period(7,{bonuses:[bonus(500,{paymentType:'nonCash',vacationTreatment:null})]}),period(8),period(9)]);
 assert.equal(result.variableGrossTotal,0);
});


test('quarterly bonuses cannot masquerade as monthly variable payments',()=>fails(()=>invoke([period(7,{bonuses:[bonus(200,{frequency:'quarterly'})]}),period(8),period(9)]),'vacation-base-error-bonus-frequency'));
test('historical vacation hours are excluded from actual worked denominator',()=>{
 const b=[period(7,{leave:[{start:'2026-07-06',end:'2026-07-10'}]}),period(8),period(9)];
 const result=invoke(b);assert.equal(result.actualHoursTotal,440);
});
test('historical sick leave hours are excluded from denominator',()=>{
 const b=[period(7,{l4:[{start:'2026-07-06',end:'2026-07-10',paymentType:'standard80'}]}),period(8),period(9)];
 const result=invoke(b);assert.equal(result.actualHoursTotal,440);
});
test('leave and sick ranges overlapping do not double-count vacation hours',()=>{
 const value=getVacationScheduledHours({year:2026,month:10,leave:[{start:'2026-10-12',end:'2026-10-16'}],l4:[{start:'2026-10-14',end:'2026-10-16'}],holidays:[]});
 assert.equal(value,16);
});
test('missing month blocks automatic calculation',()=>fails(()=>invoke([period(7),period(9)]),'vacation-base-error-missing-history'));
test('fully unworked historical month blocks automatic calculation',()=>fails(()=>invoke([period(7,{l4:[{start:'2026-07-01',end:'2026-07-31'}]}),period(8),period(9)]),'vacation-base-error-unworked-period'));
test('under 3 months tenure uses shorter period',()=>{
 const result=invoke([period(9)],{}, {relation:{id:'relation',startDate:'2026-09-05',endDate:null,paymentMode:'monthly'}});
 assert.deepEqual(result.referencePeriods,['2026-09']);
});
test('hourly employee gets rate from historical regular wages',()=>{
 const months=[period(7,{paymentMode:'hourly',rate:35}),period(8,{paymentMode:'hourly',rate:35}),period(9,{paymentMode:'hourly',rate:35})];
 const result=invoke(months,{workRateType:'uop_hourly',rate:35},{relation:{id:'relation',startDate:'2026-01-01',endDate:null,paymentMode:'hourly'}});
 assert.equal(result.vacationHourlyRate,35);assert.equal(result.monthlyBase,6160);
});
test('hourly employee with no historical work must enter manual base',()=>fails(()=>invoke([],{workRateType:'uop_hourly',rate:35},{relation:{id:'relation',startDate:'2026-10-01',endDate:null,paymentMode:'hourly'}}),'vacation-base-error-no-history'));
test('fixed monthly salary can use current month when employment starts now',()=>{
 const result=invoke([],{workRateType:'uop_monthly'},{relation:{id:'relation',startDate:'2026-10-01',endDate:null,paymentMode:'monthly'}});
 assert.equal(result.monthlyBase,6000);
});
test('no vacation => no calculation',()=>fails(()=>invoke(undefined,{leave:[]}), 'vacation-base-error-no-leave'));
test('3/12 lookback selection respects 12 months and missing data',()=>{
 fails(()=>invoke(undefined,{vacationBaseMonths:12}),'vacation-base-error-missing-history');
});
test('noncash variable bonus cannot be silently treated as eligible cash',()=>fails(()=>invoke([period(7,{bonuses:[bonus(50,{paymentType:'nonCash'})]}),period(8),period(9)]),'vacation-base-error-bonus-frequency'));
test('historical overtime feeds the monthly variable component',()=>{
 const result=invoke([period(7,{dailyOvertime:10}),period(8),period(9)]);
 assert.equal(result.variableGrossTotal,562.5); // 6000/160 * 10 * 1.5
 assert.equal(result.actualHoursTotal,490);
});
test('continuous vacation crossing two months blocks a new automatic reference period',()=>{
 const months=[period(7),period(8),period(9,{leave:[{start:'2026-09-30',end:'2026-09-30'}]})];
 fails(()=>invoke(months,{leave:[{start:'2026-10-01',end:'2026-10-02'}]}),'vacation-base-error-cross-month');
});
