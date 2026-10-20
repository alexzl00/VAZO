/** Run from project root: node --test tests/mandate-sickness-base.test.cjs
 * Requires existing package dependencies (typescript and dayjs), no new test runner.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');

// Test only the calculator and shared computation modules; TS transpilation
// makes these pure functions testable using Node's built-in test runner.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

// workTypeSalaryCalc also imports UI-irrelevant calendar helpers. All tested
// functions use the real production modules when the full project is installed.
const { getMandateContributionContext } = require('../src/utils/mandateContributionBase.ts');
const { getBonusTotals } = require('../src/utils/salaryBonusTotals.ts');
const {
  calculateMandateSicknessBases,
  MandateSicknessBaseError,
} = require('../src/utils/calculateMandateSicknessBase.ts');

const bonus = (amount, overrides = {}) => ({ id: 'bonus', name: 'Bonus', amount, frequency: 'monthly', ...overrides });
const historyMonth = (month, overrides = {}) => ({
  salaryId: `salary-${month}`, year: 2026, month,
  engineId: 'pl-2026-v1', inputSchemaId: 'salary-input-v1',
  paymentMode: 'hourly', employmentStartDate: null, employmentEndDate: null,
  grossSalaryCalculated: 0, pensionDisabilityBaseCalculated: null,
  rate: 50, workingHours: 170,
  isStudent: false, isUnder26: false,
  mandateVoluntarySicknessInsurance: true, sicknessBenefitEligible: true,
  mandateHasOtherUopAtLeastMinimumBase: false,
  mandateOtherSocialBaseBeforeThisContract: 0,
  isOwnEmployerContract: false, performedForOwnEmployer: false,
  previousPensionDisabilityBase: 0,
  holidays: [], l4: [], l4Base: 0, l4BaseAfterTermination: null,
  bonuses: [], calculationSettings: {}, ...overrides,
});
const params = (months, targetOverrides = {}, relationOverrides = {}) => ({
  history: {
    relation: { id: 'relation', startDate: '2026-09-01', endDate: null, paymentMode: 'hourly', ...relationOverrides },
    historyStart: '2026-09-01', historyEnd: '2026-09-01', missingPeriods: [],
    months,
  },
  target: {
    year: 2026, month: 10, rate: 50, workingHours: 170,
    l4: [{ start: '2026-10-10', end: '2026-10-12', paymentType: 'standard80' }],
    holidays: [], isStudent: false, isUnder26: false,
    mandateVoluntarySicknessInsurance: true, sicknessBenefitEligible: true,
    mandateHasOtherUopAtLeastMinimumBase: false,
    mandateOtherSocialBaseBeforeThisContract: 0,
    isOwnEmployerContract: false, performedForOwnEmployer: false,
    bonuses: [], previousPensionDisabilityBase: 0,
    ...targetOverrides,
  },
});

const calculate = (p) => calculateMandateSicknessBases(p).duringEmployment;
const failsWith = (p, id) => assert.throws(() => calculateMandateSicknessBases(p), (err) => {
  assert.ok(err instanceof MandateSicknessBaseError);
  assert.equal(err.id, id);
  return true;
});

test('shared bonus totals: cash and noncash are both contributory', () => {
  assert.deepEqual(getBonusTotals({ bonuses: [bonus(100), bonus(200, { paymentType: 'nonCash' })] }), {
    cashBonusTotal: 100, nonCashBonusTotal: 200, bonusTotal: 300,
  });
});
test('shared UZ base: insurance exemptions and monthly sickness cap', () => {
  const base = {
    regularRemunerationBrutto: 30000, minimumWage: 4806,
    voluntarySicknessMonthlyBaseLimit: 23550,
    mandateVoluntarySicknessInsurance: true,
  };
  assert.equal(getMandateContributionContext(base).sicknessContributionBase, 23550);
  assert.equal(getMandateContributionContext({ ...base, isStudent: true, isUnder26: true }).socialInsuranceBase, 0);
  assert.equal(getMandateContributionContext({ ...base, mandateHasOtherUopAtLeastMinimumBase: true }).sicknessContributionBase, 0);
});
test('one full insured month, bonus, exact cent-scale 13.71% deduction', () => {
  const result = calculate(params([historyMonth(9, { bonuses: [bonus(2000)] })]));
  assert.equal(result.base, 9060.45);
  assert.equal(result.monthDetails[0].deduction, 1439.55);
  assert.deepEqual(result.usedPeriods, ['2026-09']);
});
test('reuses the previous established L4 base within a month-gap', () => {
  const result = calculate(params([historyMonth(9, {
    l4: [{ start: '2026-09-17', end: '2026-09-21', paymentType: 'standard80' }],
    l4Base: 7200,
  })]));
  assert.equal(result.base, 7200);
  assert.equal(result.source, 'reusedPreviousBase');
});
test('rejects missing unknown insurance months', () => {
  const p = params([historyMonth(9)], {}, { startDate: '2026-08-01' });
  p.history.missingPeriods = ['2026-08'];
  failsWith(p, 'mandate-l4-base-error-missing-history');
});
test('rejects uncertain prior L4 work-hours instead of guessing schedule', () => {
  const p = params([historyMonth(9, {
    l4: [{ start: '2026-09-03', end: '2026-09-05', paymentType: 'standard80' }],
  })]);
  failsWith(p, 'mandate-l4-base-error-absence-hours');
});
test('rejects incompatible historical calculation versions', () => {
  failsWith(params([historyMonth(9, { engineId: 'pl-2027-v1' })]), 'mandate-l4-base-error-engine');
});
test('post-termination applies the verified 2026 autumn cap', () => {
  const p = params([historyMonth(9, { rate: 90, workingHours: 170 })], {
    employmentEndDate: '2026-10-09',
    l4: [{ start: '2026-10-10', end: '2026-10-12', paymentType: 'standard80' }],
  }, { endDate: '2026-10-09' });
  const result = calculateMandateSicknessBases(p).afterEmployment;
  assert.equal(result.base, 9233.13);
});
test('year-specific sickness cap: 2025 not inherited from 2026', () => {
  const month = historyMonth(9, { year: 2025, rate: 150, workingHours: 200 });
  const p = params([month], { year: 2025, month: 10,
    l4: [{ start: '2025-10-10', end: '2025-10-12', paymentType: 'standard80' }] },
    { startDate: '2025-09-01' });
  const result = calculate(p);
  assert.equal(result.monthDetails[0].grossContributionBase, 21682.50);
});
test('first partial calendar month requires manual proof', () => {
  const p = params([], {}, { startDate: '2026-10-05' });
  failsWith(p, 'mandate-l4-base-error-no-full-month');
});
test('accident insurance works without voluntary sickness insurance', () => {
  const p = params([historyMonth(9, { mandateVoluntarySicknessInsurance: false })], {
    mandateVoluntarySicknessInsurance: false,
    sicknessBenefitEligible: false,
    l4: [{ start: '2026-10-10', end: '2026-10-12', paymentType: 'accident100' }],
  });
  const result = calculate(p);
  assert.equal(result.base, 7334.65); // Accident benefits also use the statutory 13.71% reduction
});

test('post-termination uses saved insurance history even when current-month flag is false', () => {
  const p = params([historyMonth(9)], {
    mandateVoluntarySicknessInsurance: false,
    l4: [{ start: '2026-10-10', end: '2026-10-12', paymentType: 'standard80' }],
  }, { endDate: '2026-10-09' });
  const result = calculateMandateSicknessBases(p).afterEmployment;
  assert.equal(result.base, 7334.65); // 8500 × (1 - 0.1371)
});

test('pension/disability annual ceiling is independent of voluntary sickness cap', () => {
  const month = historyMonth(9, {
    rate: 50, workingHours: 170,
    previousPensionDisabilityBase: 282000,
    pensionDisabilityBaseCalculated: 600,
  });
  const result = calculate(params([month]));
  assert.equal(result.monthDetails[0].deduction, 1165.35); // Statutory 13.71%, independent of annual retirement cap
});
