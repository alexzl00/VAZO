const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Load the existing TypeScript helper directly; no separate build is needed.
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const {
  getNominalWorkingHoursInMonth,
  getWorkedDaysInMonthWithPolishHolidays,
} = require('../src/utils/workingTimeHelper.ts');

const dayOff = (date) => [{ start: date, end: date }];
const hoursFromWorkingDays = (year, monthIndex, selected = []) =>
  getWorkedDaysInMonthWithPolishHolidays(year, monthIndex, selected) * 8;

test('August 2026: a Saturday holiday alone does not shorten the marked Mon–Fri schedule', () => {
  assert.equal(getNominalWorkingHoursInMonth(2026, 7), 168);
  assert.equal(hoursFromWorkingDays(2026, 7), 168);
});

test('August 2026: marking the employer-designated weekday off subtracts exactly 8 hours', () => {
  const selected = dayOff('2026-08-17');
  assert.equal(getNominalWorkingHoursInMonth(2026, 7, selected), 160);
  assert.equal(hoursFromWorkingDays(2026, 7, selected), 160);
});

test('August 2026: selecting Saturday itself does not subtract working hours', () => {
  assert.equal(getNominalWorkingHoursInMonth(2026, 7, dayOff('2026-08-15')), 168);
});

test('December 2026: Christmas Saturday requires a separately selected replacement weekday', () => {
  assert.equal(getNominalWorkingHoursInMonth(2026, 11), 168);
  const selected = dayOff('2026-12-28');
  assert.equal(getNominalWorkingHoursInMonth(2026, 11, selected), 160);
  assert.equal(hoursFromWorkingDays(2026, 11, selected), 160);
});

test('Weekday public holidays are still automatically excluded', () => {
  // Jan 1 and Jan 6, 2026 are both weekdays.
  assert.equal(getNominalWorkingHoursInMonth(2026, 0), 160);
  assert.equal(hoursFromWorkingDays(2026, 0), 160);
});

test('Selecting a statutory weekday holiday does not double-count it', () => {
  assert.equal(getNominalWorkingHoursInMonth(2026, 0, dayOff('2026-01-01')), 160);
});
