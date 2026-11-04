import type { SalaryRecord } from '../api/Salaries';
import type { SalaryBonus, SalaryCalculatorValues } from '../types/salaryCalculator';
import type { WorkRelation } from '../types/workRelation';
import type { SalaryCalculationResult } from './workTypeSalaryCalc';
import { getVacationScheduledHours } from './vacationWorkingTime';
import { getHistoricalPayrollStatutoryConfig } from './statutory/payrollStatutoryConfig';

/** The saved finance and contract types remain the source of truth. */
export type StatisticsSalary = Pick<SalaryRecord,
  'id' | 'workRelationId' | 'year' | 'month' | 'contractType' | 'paymentMode' |
  'grossSalaryCalculated' | 'netSalaryCalculated' | 'grossSalaryOverride' |
  'netSalaryOverride' | 'employmentStartDate' | 'employmentEndDate'
> & Pick<SalaryCalculatorValues,
  'l4' | 'leave' | 'holidays' | 'dailyOvertime' | 'weekendHolidayOvertime' |
  'nightOvertime' | 'turnOfDayHours'
> & {
  bonuses: Pick<SalaryBonus, 'name' | 'amount' | 'paymentType'>[];
  /** Only populated if the existing engine matches persisted gross/net to the grosz. */
  verifiedCalculation: SalaryCalculationResult | null;
};
export type StatisticsPeriod = { start: string; end: string }; // inclusive, YYYY-MM
export type StatisticsGrouping = 'month' | 'quarter' | 'year';
export type StatisticsPoint = { key: string; gross: number | null; net: number | null; records: number };
export type StatisticsResult = {
  summary: {
    net: number; gross: number; averageNet: number; averageGross: number;
    paidMonths: number; recordCount: number; bonusCash: number; bonusNonCash: number;
    overtimeHours: number; turnOfDayHours: number;
    l4Days: number; vacationHours: number; vacationDays: number;
  };
  points: StatisticsPoint[];
  detail: {
    verified: boolean;
    missingRecordCount: number;
    overtimePayout: number | null;
    employerSickPay: number | null;
    sicknessBenefit: number | null;
    employerSickPayDays: number | null;
    sicknessBenefitDays: number | null;
    vacationPayment: number | null;
    structure: { basic: number; overtime: number; bonuses: number; other: number; unclassified: number } | null;
  };
};
export type AnnualFacts = {
  year: number;
  values: { taxableIncome: number; pit0Revenue: number; pensionDisabilityBase: number };
  missingFacts: number;
  // Incomplete fields are tracked separately so a valid fact is never dropped.
  missingFactsByField: { taxableIncome: number; pit0Revenue: number; pensionDisabilityBase: number };
  missingMonths: number;
  recordCount: number;
};
export type AnnualFactRecord = {
  id: string; workRelationId: string; year: number; month: number;
  taxableIncome: string | number | null;
  pit0Revenue: string | number | null;
  pensionDisabilityBase: string | number | null;
};

/** Parse financial values as integral grosz (no floating-point accumulation). */
export function toGrosz(value: string | number): bigint {
  const raw = String(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(raw)) throw new Error(`Invalid money: ${raw}`);
  const neg = raw.startsWith('-');
  const [whole, fraction = ''] = (neg ? raw.slice(1) : raw).split('.');
  if (fraction.length > 2 && /[1-9]/.test(fraction.slice(2))) throw new Error(`Sub-grosz precision: ${raw}`);
  const amount = BigInt(whole) * 100n + BigInt((fraction + '00').slice(0, 2));
  return neg ? -amount : amount;
}
export function fromGrosz(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < -BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Financial total exceeds safe numeric range');
  }
  return Number(value) / 100;
}
function roundedMean(total: bigint, months: number): bigint {
  if (!months) return 0n;
  const negative = total < 0n;
  const absolute = negative ? -total : total;
  const result = (absolute * 2n + BigInt(months)) / (2n * BigInt(months));
  return negative ? -result : result;
}

function toMicrohours(value: number): bigint {
  const raw = String(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(raw)) throw new Error(`Invalid hours: ${raw}`);
  const neg = raw.startsWith('-');
  const [whole, fraction = ''] = (neg ? raw.slice(1) : raw).split('.');
  if (fraction.length > 6 && /[1-9]/.test(fraction.slice(6))) throw new Error(`Sub-microhour precision: ${raw}`);
  const micro = BigInt(whole) * 1_000_000n + BigInt((fraction + '000000').slice(0, 6));
  return neg ? -micro : micro;
}
function fromMicrohours(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < -BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Hours out of range');
  return Number(value) / 1_000_000;
}

export const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;
function parseMonth(value: string): [number, number] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new Error(`Invalid month: ${value}`);
  return [Number(value.slice(0, 4)), Number(value.slice(5))];
}
export function periodKeys(period: StatisticsPeriod, grouping: StatisticsGrouping): string[] {
  const [sy, sm] = parseMonth(period.start);
  const [ey, em] = parseMonth(period.end);
  const count = (ey - sy) * 12 + em - sm + 1;
  if (count < 1 || count > 120) throw new Error('Invalid statistics period (max 120 months)');
  const keys = new Set<string>();
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.UTC(sy, sm - 1 + i, 1));
    const year = date.getUTCFullYear(), month = date.getUTCMonth() + 1;
    keys.add(grouping === 'month' ? monthKey(year, month)
      : grouping === 'quarter' ? `${year}-Q${Math.ceil(month / 3)}` : String(year));
  }
  return [...keys];
}
function groupKey(year: number, month: number, grouping: StatisticsGrouping) {
  return grouping === 'month' ? monthKey(year, month)
    : grouping === 'quarter' ? `${year}-Q${Math.ceil(month / 3)}` : String(year);
}
export function relationOverlapsPeriod(relation: WorkRelation, period: StatisticsPeriod): boolean {
  const [year, month] = parseMonth(period.end);
  const periodEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return relation.start_date <= periodEnd && (!relation.end_date || relation.end_date >= `${period.start}-01`);
}

function enumerateMonthDays(ranges: { start: string; end: string }[], year: number, month: number): string[] {
  const from = `${monthKey(year, month)}-01`;
  const until = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const days = new Set<string>();
  for (const range of ranges) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(range.start) || !/^\d{4}-\d{2}-\d{2}$/.test(range.end)) throw new Error('Invalid absence date');
    const start = range.start > from ? range.start : from;
    const end = range.end < until ? range.end : until;
    if (start > end) continue;
    const date = new Date(`${start}T00:00:00Z`);
    const stop = new Date(`${end}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || Number.isNaN(stop.getTime())) throw new Error('Invalid absence date');
    while (date <= stop) {
      days.add(date.toISOString().slice(0, 10));
      date.setUTCDate(date.getUTCDate() + 1);
    }
  }
  return [...days];
}

/**
 * Saved gross/net always win. An unverified record does not erase verified
 * portions of the chart: its full gross is kept explicitly unclassified.
 * Payout availability is assessed for each component independently so a
 * salary without L4 does not make an L4 total unavailable.
 */
export function buildSalaryStatistics(salaries: StatisticsSalary[], period: StatisticsPeriod, grouping: StatisticsGrouping): StatisticsResult {
  const groups = new Map<string, { gross: bigint; net: bigint; records: number }>();
  const months = new Set<string>();
  const l4Days = new Set<string>();
  const seen = new Set<string>();
  let gross = 0n, net = 0n, bonusCash = 0n, bonusNonCash = 0n;
  let overtimeMicrohours = 0n, turnOfDayMicrohours = 0n, vacationHours = 0;
  let overtimePayout = 0n, employerSickPay = 0n, sicknessBenefit = 0n, vacationPayment = 0n;
  let employerSickPayDays = 0, sicknessBenefitDays = 0;
  let basic = 0n, overtime = 0n, bonuses = 0n, other = 0n, unclassified = 0n;
  let missing = 0;
  let overtimeComplete = true, sicknessComplete = true, vacationComplete = true;
  let breakdownPossible = true;

  for (const item of salaries) {
    const key = monthKey(item.year, item.month);
    if (key < period.start || key > period.end || seen.has(item.id)) continue;
    seen.add(item.id);
    const itemGross = toGrosz(item.grossSalaryOverride ?? item.grossSalaryCalculated);
    const itemNet = toGrosz(item.netSalaryOverride ?? item.netSalaryCalculated);
    gross += itemGross; net += itemNet; months.add(key);
    const group = groupKey(item.year, item.month, grouping);
    const state = groups.get(group) ?? { gross: 0n, net: 0n, records: 0 };
    state.gross += itemGross; state.net += itemNet; state.records++;
    groups.set(group, state);

    for (const b of item.bonuses) {
      if (b.paymentType === 'nonCash') bonusNonCash += toGrosz(b.amount);
      else bonusCash += toGrosz(b.amount);
    }
    const itemL4Days = enumerateMonthDays(item.l4, item.year, item.month);
    for (const date of itemL4Days) l4Days.add(date);
    let itemVacationHours = 0;
    if (item.contractType === 'uop') {
      overtimeMicrohours += toMicrohours(item.dailyOvertime) + toMicrohours(item.weekendHolidayOvertime) + toMicrohours(item.nightOvertime);
      turnOfDayMicrohours += toMicrohours(item.turnOfDayHours);
      itemVacationHours = getVacationScheduledHours({
        year: item.year, month: item.month, leave: item.leave, l4: item.l4, holidays: item.holidays,
        employmentStartDate: item.employmentStartDate, employmentEndDate: item.employmentEndDate,
      });
      vacationHours += itemVacationHours;
    }

    const calc = item.verifiedCalculation;
    const hasChangedGross = item.grossSalaryOverride !== null &&
      toGrosz(item.grossSalaryOverride) !== toGrosz(item.grossSalaryCalculated);
    const canUseCalc = calc !== null && !hasChangedGross;
    const requiresOvertime = item.contractType === 'uop' &&
      (item.dailyOvertime !== 0 || item.weekendHolidayOvertime !== 0 ||
        item.nightOvertime !== 0 || item.turnOfDayHours !== 0);
    const requiresSickness = itemL4Days.length > 0;
    const requiresVacation = itemVacationHours > 0;
    if (!canUseCalc) {
      if (requiresOvertime) overtimeComplete = false;
      if (requiresSickness) sicknessComplete = false;
      if (requiresVacation) vacationComplete = false;
      unclassified += itemGross;
      missing++;
      if (itemGross < 0n) breakdownPossible = false;
      continue;
    }

    // Monetary figures from the already-reconciled payroll calculation.
    const sickPay = toGrosz(calc.employerSickPay ?? 0);
    const benefit = toGrosz(calc.sicknessBenefit ?? 0);
    const leavePay = toGrosz(calc.leavePayment ?? 0);
    const engineOvertime = toGrosz(calc.overtimes ?? 0);
    const nightAllowance = toGrosz(calc.nightWorkAllowance ?? 0);
    const engineBonuses = toGrosz(calc.bonusTotal ?? 0);
    const allowance = toGrosz(calc.functionalAllowancePayment ?? 0);
    const workPay = item.contractType === 'uop'
      ? toGrosz(calc.workDaysPayment ?? 0)
      // Mandate and work-contract base are the unallocated part of the gross,
      // including any non-salary amount not included in their bonus snapshot.
      : toGrosz(calc.fullSalaryBrutto) - engineBonuses - benefit;
    const remainder = sickPay + benefit + leavePay + allowance;
    const allocated = workPay + engineOvertime + engineBonuses + remainder;
    const payoutValid = [sickPay, benefit, leavePay, engineOvertime, nightAllowance].every(v => v >= 0n)
      && engineOvertime >= nightAllowance;
    if (payoutValid) {
      overtimePayout += engineOvertime - nightAllowance;
      employerSickPay += sickPay;
      sicknessBenefit += benefit;
      vacationPayment += leavePay;
      employerSickPayDays += calc.employerSickPayDays ?? 0;
      sicknessBenefitDays += calc.sicknessBenefitDays ?? 0;
    } else {
      if (requiresOvertime) overtimeComplete = false;
      if (requiresSickness) sicknessComplete = false;
      if (requiresVacation) vacationComplete = false;
    }

    // A valid payout does not automatically mean the *full structure* reconciles.
    if (allocated === toGrosz(calc.fullSalaryBrutto) &&
      [workPay, engineOvertime, engineBonuses, remainder].every(v => v >= 0n)) {
      basic += workPay;
      overtime += engineOvertime;
      bonuses += engineBonuses;
      other += remainder;
    } else {
      unclassified += itemGross;
      missing++;
      if (itemGross < 0n) breakdownPossible = false;
    }
  }
  const totalParts = basic + overtime + bonuses + other + unclassified;
  const hasStructure = seen.size > 0 && breakdownPossible && totalParts === gross && gross > 0n;
  return {
    summary: {
      gross: fromGrosz(gross), net: fromGrosz(net),
      averageGross: fromGrosz(roundedMean(gross, months.size)),
      averageNet: fromGrosz(roundedMean(net, months.size)),
      paidMonths: months.size, recordCount: seen.size,
      bonusCash: fromGrosz(bonusCash), bonusNonCash: fromGrosz(bonusNonCash),
      overtimeHours: fromMicrohours(overtimeMicrohours), turnOfDayHours: fromMicrohours(turnOfDayMicrohours),
      l4Days: l4Days.size, vacationHours, vacationDays: vacationHours / 8,
    },
    points: periodKeys(period, grouping).map(key => {
      const row = groups.get(key);
      return { key, gross: row ? fromGrosz(row.gross) : null,
        net: row ? fromGrosz(row.net) : null, records: row?.records ?? 0 };
    }),
    detail: {
      verified: seen.size > 0 && missing === 0 && overtimeComplete && sicknessComplete && vacationComplete,
      missingRecordCount: missing,
      overtimePayout: overtimeComplete ? fromGrosz(overtimePayout) : null,
      employerSickPay: sicknessComplete ? fromGrosz(employerSickPay) : null,
      sicknessBenefit: sicknessComplete ? fromGrosz(sicknessBenefit) : null,
      employerSickPayDays: sicknessComplete ? employerSickPayDays : null,
      sicknessBenefitDays: sicknessComplete ? sicknessBenefitDays : null,
      vacationPayment: vacationComplete ? fromGrosz(vacationPayment) : null,
      structure: hasStructure ? {
        basic: fromGrosz(basic), overtime: fromGrosz(overtime),
        bonuses: fromGrosz(bonuses), other: fromGrosz(other),
        unclassified: fromGrosz(unclassified),
      } : null,
    },
  };
}

export function getAnnualLimits(year: number) {
  // Reuse the exact same statutory source as UoP, mandate and work contracts.
  // 2024 is a historical-lookback year; newer unsupported years return null.
  const config = getHistoricalPayrollStatutoryConfig(year, 1);
  return {
    taxableIncome: config?.pitThreshold ?? null,
    pit0Revenue: config?.pit0Limit ?? null,
    pensionDisabilityBase: config?.zusAnnualPensionDisabilityLimit ?? null,
  };
}

/** Full tax year, only the selected work relations; independent of chart date range. */
export function buildAnnualFacts(year: number, records: AnnualFactRecord[], relations: WorkRelation[], currentDate = new Date()): AnnualFacts {
  let taxable = 0n, pit0 = 0n, pension = 0n, missingFacts = 0, recordCount = 0;
  const missingFactsByField = { taxableIncome: 0, pit0Revenue: 0, pensionDisabilityBase: 0 };
  const selectedIds = new Set(relations.map(relation => relation.id));
  const included = new Set<string>();
  const saved = new Set<string>();
  for (const row of records) {
    if (row.year !== year || !selectedIds.has(row.workRelationId) || included.has(row.id)) continue;
    included.add(row.id);
    saved.add(`${row.workRelationId}:${monthKey(row.year, row.month)}`);
    recordCount++;
    const missingTaxable = row.taxableIncome === null;
    const missingPit0 = row.pit0Revenue === null;
    const missingPension = row.pensionDisabilityBase === null;
    if (missingTaxable || missingPit0 || missingPension) missingFacts++;
    if (row.taxableIncome === null) missingFactsByField.taxableIncome++;
    else taxable += toGrosz(row.taxableIncome);
    if (row.pit0Revenue === null) missingFactsByField.pit0Revenue++;
    else pit0 += toGrosz(row.pit0Revenue);
    if (row.pensionDisabilityBase === null) missingFactsByField.pensionDisabilityBase++;
    else pension += toGrosz(row.pensionDisabilityBase);
  }
  const endMonth = currentDate.getFullYear() === year ? currentDate.getMonth() + 1 : year < currentDate.getFullYear() ? 12 : 0;
  let missingMonths = 0;
  for (const relation of relations) {
    for (let month = 1; month <= endMonth; month++) {
      const monthStart = `${monthKey(year, month)}-01`;
      const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
      if (relation.start_date > monthEnd || (relation.end_date && relation.end_date < monthStart)) continue;
      if (!saved.has(`${relation.id}:${monthKey(year, month)}`)) missingMonths++;
    }
  }
  return {
    year, recordCount, missingFacts, missingFactsByField, missingMonths,
    values: { taxableIncome: fromGrosz(taxable), pit0Revenue: fromGrosz(pit0), pensionDisabilityBase: fromGrosz(pension) },
  };
}
