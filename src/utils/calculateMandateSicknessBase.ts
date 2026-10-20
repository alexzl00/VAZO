import dayjs from 'dayjs';
import { getBonusTotals } from './salaryBonusTotals';
import { getMandateContributionContext } from './mandateContributionBase';
import { calculateUopPensionDisabilityBase } from './uopSocialContributionBase';
import { employeeSocialInsuranceRate } from './workTypeSalaryCalc';
import type {
  CalculateMandateSicknessBasesParams,
  MandateSicknessBaseHistory,
  MandateSicknessBaseResult,
  MandateSicknessBasesResult,
  MandateSicknessHistoryMonth,
} from '../types/mandateSicknessBase';
import type { L4Range } from '../types/salaryCalculator';

export class MandateSicknessBaseError extends Error {
  public id: string;
  public values?: Record<string, string | number>;

  constructor(
    id: string,
    values?: Record<string, string | number>,
  ) {
    super(id);

    this.name = 'MandateSicknessBaseError';
    this.id = id;
    this.values = values;
  }
}

const round2 = (number: number) => Math.round((number + Number.EPSILON) * 100) / 100;
const period = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;
const firstOfMonth = (year: number, month: number) => dayjs(`${period(year, month)}-01`);
const monthOffset = (date: dayjs.Dayjs, offset: number) => date.add(offset, 'month').format('YYYY-MM');

// The historical year is essential: NEVER calculate 2024/25 sickness bases
// using the current payroll year's 2026 minimum wage/voluntary sickness cap.
const contributionLimits: Record<number, { minimumWage: number; voluntarySicknessCap: number; annualPensionCap: number }> = {
  2024: { minimumWage: 4300, voluntarySicknessCap: 19560, annualPensionCap: 234720 },
  2025: { minimumWage: 4666, voluntarySicknessCap: 21682.5, annualPensionCap: 260190 },
  2026: { minimumWage: 4806, voluntarySicknessCap: 23550, annualPensionCap: 282600 },
};

const getLimits = (year: number, month: number) => {
  if (year === 2024 && month <= 6) {
    return { minimumWage: 4242, voluntarySicknessCap: 19560, annualPensionCap: 234720 };
  }
  const limits = contributionLimits[year];
  if (!limits) throw new MandateSicknessBaseError('mandate-l4-base-error-year', { year });
  return limits;
};

/** GUS national-average quarterly limits, effective in three-month blocks.
 * Never silently apply a guessed rate to an unverified future quarter.
 * https://psz.zus.pl/pl/web/guest/baza-wiedzy/skladki-wskazniki-odsetki/wskazniki/minimalne-i-przecietne-wynagrodzenie
 */
const postInsuranceMaximum2026: Record<number, number> = {
  1: 8771.70, 2: 8771.70,
  3: 9197.79, 4: 9197.79, 5: 9197.79,
  6: 9562.88, 7: 9562.88, 8: 9562.88,
  9: 9233.13, 10: 9233.13, 11: 9233.13,
};

const maxPostInsuranceBase = (year: number, month: number): number => {
  const limit = year === 2026 ? postInsuranceMaximum2026[month] : undefined;
  if (limit === undefined) {
    throw new MandateSicknessBaseError('mandate-l4-base-error-post-termination-limit', {
      period: period(year, month),
    });
  }
  return limit;
};

const getFirstL4Day = (ranges: L4Range[]) => ranges.map(r => r.start).sort()[0] ?? null;

const reusePreviousBase = (
  history: MandateSicknessBaseHistory,
  firstL4Day: string,
  afterEmployment: boolean,
) => {
  const latest = history.months.flatMap(month => month.l4
    .filter(range => range.end < firstL4Day)
    .map(range => ({ month, end: range.end })))
    .sort((a, b) => b.end.localeCompare(a.end))[0];
  if (!latest) return null;
  const a = dayjs(latest.end);
  const b = dayjs(firstL4Day);
  const monthGap = (b.year() - a.year()) * 12 + b.month() - a.month();
  if (monthGap > 1) return null;
  const saved = afterEmployment
    ? latest.month.l4BaseAfterTermination
    : latest.month.l4Base;
  if (saved == null || saved <= 0) return null;
  return { base: round2(saved), period: period(latest.month.year, latest.month.month) };
};

const insuredInHistoricalMonth = (
  month: MandateSicknessHistoryMonth,
  mode: 'sickness' | 'accident',
) => {
  const limits = getLimits(month.year, month.month);
  const { bonusTotal } = getBonusTotals(month);
  const gross = round2(month.rate * month.workingHours + bonusTotal);
  const contribution = getMandateContributionContext({
    ...month,
    regularRemunerationBrutto: gross,
    minimumWage: limits.minimumWage,
    voluntarySicknessMonthlyBaseLimit: limits.voluntarySicknessCap,
  });
  // The historical engine identifies whether its saved input schema may be
  // safely reconstructed. Do not silently interpret unknown future records.
  if (month.engineId !== 'pl-2026-v1' || month.inputSchemaId !== 'salary-input-v1') {
    throw new MandateSicknessBaseError('mandate-l4-base-error-engine', {
      period: period(month.year, month.month),
    });
  }
  return {
    active: mode === 'sickness'
      ? contribution.voluntarySicknessInsuranceActive
      : contribution.accidentContributionBase > 0,
    contributionBase: mode === 'sickness'
      ? contribution.sicknessContributionBase
      : contribution.accidentContributionBase,
  };
};

const calculateForContext = (
  params: CalculateMandateSicknessBasesParams,
  ranges: L4Range[],
  afterEmployment: boolean,
): MandateSicknessBaseResult => {
  const { history, target } = params;
  const firstL4Day = getFirstL4Day(ranges);
  if (!firstL4Day) throw new MandateSicknessBaseError('l4-base-error-no-l4');

  const modes = new Set(ranges.map(range => range.paymentType === 'accident100' ? 'accident' : 'sickness'));
  if (modes.size > 1) {
    throw new MandateSicknessBaseError('mandate-l4-base-error-mixed-insurance');
  }
  const mode = modes.has('sickness') ? 'sickness' : 'accident';
  const targetLimits = getLimits(target.year, target.month);
  const targetContributions = getMandateContributionContext({
    ...target,
    regularRemunerationBrutto: round2(
      target.rate * target.workingHours + getBonusTotals(target).bonusTotal,
    ),
    minimumWage: targetLimits.minimumWage,
    voluntarySicknessMonthlyBaseLimit: targetLimits.voluntarySicknessCap,
  });
  if (mode === 'sickness' && ((!afterEmployment && !targetContributions.voluntarySicknessInsuranceActive) || !target.sicknessBenefitEligible)) {
    throw new MandateSicknessBaseError('mandate-l4-base-error-not-eligible');
  }
  if (mode === 'accident' && !afterEmployment && targetContributions.accidentContributionBase <= 0) {
    throw new MandateSicknessBaseError('mandate-l4-base-error-no-accident-insurance');
  }

  // Restrict post-termination results by the exact statutory quarter.
  // This is done even for a reused historical base.
  const postCap = afterEmployment ? maxPostInsuranceBase(target.year, target.month) : null;
  const reused = reusePreviousBase(history, firstL4Day, afterEmployment);
  if (reused) return {
    base: postCap === null ? reused.base : Math.min(reused.base, postCap),
    source: 'reusedPreviousBase',
    reusedFromPeriod: reused.period,
    referencePeriod: { start: reused.period, end: reused.period },
    usedPeriods: [], excludedPeriods: [], monthDetails: [],
  };

  const first = firstOfMonth(target.year, target.month);
  // If the UZ has already ended, the reference stops at the last FULL
  // calendar month before its end, even when L4 starts in the next month.
  const relationEnd = history.relation.endDate && dayjs(history.relation.endDate);
  const anchor = afterEmployment && relationEnd && relationEnd.isValid() && relationEnd.isBefore(first)
    ? relationEnd.date() === relationEnd.daysInMonth()
      ? relationEnd.add(1, 'month').startOf('month')
      : relationEnd.startOf('month')
    : afterEmployment && relationEnd && relationEnd.isValid()
      ? relationEnd.date() === relationEnd.daysInMonth()
        ? relationEnd.add(1, 'month').startOf('month')
        : relationEnd.startOf('month')
      : first;
  const referenceStart = monthOffset(anchor, -12);
  const previous = monthOffset(anchor, -1);
  const relationStart = dayjs(history.relation.startDate);
  if (!relationStart.isValid()) throw new MandateSicknessBaseError('l4-base-error-no-usable-history');

  // Only full calendar insurance months qualify for this calculation.
  // Partial-first-month/continuity-from-another-title rules need more facts.
  const firstFull = relationStart.date() === 1
    ? relationStart.format('YYYY-MM')
    : relationStart.add(1, 'month').format('YYYY-MM');
  const expectedFrom = firstFull > referenceStart ? firstFull : referenceStart;
  const byPeriod = new Map(history.months.map(month => [period(month.year, month.month), month]));
  const selected: MandateSicknessHistoryMonth[] = [];
  // Walk back from the previous month to the nearest verified break in insurance.
  // A missing record is UNKNOWN; it must not be interpreted as a break.
  for (let key = previous; key >= expectedFrom; key = monthOffset(dayjs(`${key}-01`), -1)) {
    const month = byPeriod.get(key);
    if (!month || history.missingPeriods.includes(key)) {
      throw new MandateSicknessBaseError('mandate-l4-base-error-missing-history', { period: key });
    }
    if (!insuredInHistoricalMonth(month, mode).active) break;
    selected.push(month);
  }
  selected.reverse();
  if (selected.length === 0) {
    // UZ hourly first-month bases can require income of comparable contractors.
    // Never substitute a made-up hourly norm or an unsupported UoP formula.
    throw new MandateSicknessBaseError('mandate-l4-base-error-no-full-month');
  }
  const monthDetails = selected.map(month => {
    const key = period(month.year, month.month);
    const { contributionBase } = insuredInHistoricalMonth(month, mode);
    if (month.l4.length > 0) {
      // UZ has no legally defined Mon-Fri schedule. Saved L4 dates and the
      // total hours do not identify whether HALF the agreed time was worked.
      // Refuse an uncertain exclusion/supplementation instead of guessing.
      throw new MandateSicknessBaseError('mandate-l4-base-error-absence-hours', { period: key });
    }
    const limits = getLimits(month.year, month.month);
    const socialBase = round2(month.rate * month.workingHours + getBonusTotals(month).bonusTotal);
    const pensionBase = calculateUopPensionDisabilityBase({
      socialInsuranceBase: socialBase,
      previousPensionDisabilityBase: month.previousPensionDisabilityBase ?? 0,
      annualLimit: limits.annualPensionCap,
    });
    if (month.pensionDisabilityBaseCalculated !== null
      && Math.abs(month.pensionDisabilityBaseCalculated - pensionBase) > 0.02) {
      throw new MandateSicknessBaseError('mandate-l4-base-error-contributions-mismatch', { period: key });
    }
    // ZUS benefit-base rule for both sickness AND accident cover:
    // a statutory 13.71% reduction of the relevant contribution base.
    // The pension/disability annual limit is validated separately; it must
    // not be substituted for the sick-benefit income base.
    const deduction = round2(contributionBase * employeeSocialInsuranceRate / 100);
    return {
      period: key,
      grossContributionBase: contributionBase,
      deduction,
      netIncluded: round2(contributionBase - deduction),
      included: true,
      sicknessReduced: false,
    };
  });
  const average = round2(monthDetails.reduce((sum, month) => sum + month.netIncluded, 0) / monthDetails.length);
  return {
    base: postCap == null ? average : round2(Math.min(average, postCap)),
    source: 'history',
    referencePeriod: { start: selected[0] ? period(selected[0].year, selected[0].month) : referenceStart, end: previous },
    usedPeriods: monthDetails.map(detail => detail.period),
    excludedPeriods: [], monthDetails,
  };
};

export const calculateMandateSicknessBases = (
  params: CalculateMandateSicknessBasesParams,
): MandateSicknessBasesResult => {
  const endDate = params.history.relation.endDate;
  const during: L4Range[] = [];
  const after: L4Range[] = [];
  for (const range of params.target.l4) {
    if (!endDate || range.start <= endDate) {
      during.push({ ...range, end: endDate && range.end > endDate ? endDate : range.end });
    }
    if (endDate && range.end > endDate) {
      const nextDay = dayjs(endDate).add(1, 'day').format('YYYY-MM-DD');
      after.push({ ...range, start: range.start > nextDay ? range.start : nextDay });
    }
  }
  if (!during.length && !after.length) throw new MandateSicknessBaseError('l4-base-error-no-l4');
  return {
    duringEmployment: during.length ? calculateForContext(params, during, false) : null,
    afterEmployment: after.length ? calculateForContext(params, after, true) : null,
  };
};
