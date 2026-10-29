import dayjs from "dayjs";
import { resolveBonusTreatments } from "./bonusTreatmentDefaults";

import { getWorkedDaysInMonthWithPolishHolidays } from "./workingTimeHelper";
import { getHistoricalMinimumWage, getHistoricalUopOvertimeGross } from "./uopHistoricalOvertime";
import { employeeSocialInsuranceRate, getHistoricalPayrollStatutoryConfig } from "./statutory/payrollStatutoryConfig";
import { getPostTerminationBenefitCap } from "./statutory/postTerminationBenefitCaps";
import {
  calculateUopPensionDisabilityBase,
  calculateUopSocialInsuranceBase,
} from "./uopSocialContributionBase";
import type {
  CalculateUopSicknessBaseParams,
  UopSicknessBaseHistory,
  UopSicknessBaseMessage,
  UopSicknessBaseMonthDetail,
  UopSicknessBaseResult,
  UopSicknessBasesResult,
  UopSicknessContext,
  UopSicknessHistoryBonus,
  UopSicknessHistoryMonth,
} from "../types/uopSicknessBase";
import type { ISODateRange } from "./monthHelperFunc";

export class UopSicknessBaseError extends Error {
  id: string;
  values?: Record<string, string | number>;

  constructor(
    id: string,
    values?: Record<string, string | number>,
  ) {
    super(id);
    this.name = "UopSicknessBaseError";
    this.id = id;
    this.values = values;
  }
}


const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const percent = (value: number, rate: number) =>
  round2(value * rate / 100);

const monthStart = (year: number, month: number) =>
  dayjs(`${year}-${String(month).padStart(2, "0")}-01`);

const periodKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

const toMonthDate = (month: UopSicknessHistoryMonth) =>
  monthStart(month.year, month.month);

const getMinimumWage = getHistoricalMinimumWage;

const getAnnualPensionDisabilityLimit = (year: number, month: number): number | null =>
  getHistoricalPayrollStatutoryConfig(year, month)?.zusAnnualPensionDisabilityLimit ?? null;

const clampRangeToMonth = (
  range: ISODateRange,
  year: number,
  month: number,
) => {
  const start = monthStart(year, month);
  const end = start.endOf("month");
  const rangeStart = dayjs(range.start);
  const rangeEnd = dayjs(range.end);

  const clampedStart = rangeStart.isAfter(start, "day")
    ? rangeStart
    : start;
  const clampedEnd = rangeEnd.isBefore(end, "day")
    ? rangeEnd
    : end;

  if (
    !clampedStart.isValid()
    || !clampedEnd.isValid()
    || clampedEnd.isBefore(clampedStart, "day")
  ) {
    return null;
  }

  return { start: clampedStart, end: clampedEnd };
};

const countCalendarDays = (
  ranges: ISODateRange[],
  year: number,
  month: number,
) => {
  const uniqueDays = new Set<string>();

  ranges.forEach((range) => {
    const clamped = clampRangeToMonth(range, year, month);
    if (!clamped) return;

    let cursor = clamped.start;
    while (!cursor.isAfter(clamped.end, "day")) {
      uniqueDays.add(cursor.format("YYYY-MM-DD"));
      cursor = cursor.add(1, "day");
    }
  });

  return uniqueDays.size;
};

const getOvertimeGross = (
  month: UopSicknessHistoryMonth,
  warnings: UopSicknessBaseMessage[],
) => {
  const value = getHistoricalUopOvertimeGross(month);
  if (value.minimumWageUnavailable) {
    warnings.push({
      id: 'l4-base-warning-unsupported-historical-minimum-wage',
      values: { period: periodKey(month.year, month.month) },
    });
  }
  return value.gross;
};

const getMonthWorkStats = (month: UopSicknessHistoryMonth) => {
  const requiredWorkDays = getWorkedDaysInMonthWithPolishHolidays(
    month.year,
    month.month - 1,
    month.holidays,
    [],
    [],
  );

  // Vacation and other paid leave represented by leave[] are treated like
  // worked days for the "at least half of the month" test. L4 is not.
  const workedEquivalentDays = getWorkedDaysInMonthWithPolishHolidays(
    month.year,
    month.month - 1,
    month.holidays,
    month.l4,
    [],
  );

  return {
    requiredWorkDays,
    workedEquivalentDays,
  };
};

const getRegularGross = (
  month: UopSicknessHistoryMonth,
) => {
  const allWorkDays = getWorkedDaysInMonthWithPolishHolidays(
    month.year,
    month.month - 1,
    month.holidays,
    [],
    [],
  );

  const actualWorkDays = getWorkedDaysInMonthWithPolishHolidays(
    month.year,
    month.month - 1,
    month.holidays,
    month.l4,
    month.leave,
  );

  const workedEquivalentDays = getWorkedDaysInMonthWithPolishHolidays(
    month.year,
    month.month - 1,
    month.holidays,
    month.l4,
    [],
  );

  const l4WorkingDays = Math.max(
    0,
    allWorkDays - workedEquivalentDays,
  );

  const l4CalendarDays = countCalendarDays(
    month.l4,
    month.year,
    month.month,
  );
  const leaveCalendarDays = countCalendarDays(
    month.leave,
    month.year,
    month.month,
  );

  const leavePayment = allWorkDays > 0
    ? round2(
        (month.leaveBase / allWorkDays)
          * leaveCalendarDays,
      )
    : 0;

  if (month.paymentMode === "monthly") {
    const leaveReduction = allWorkDays > 0
      ? round2(
          (month.rate / allWorkDays)
            * leaveCalendarDays,
        )
      : 0;

    const l4Reduction = round2(
      (month.rate / 30) * l4CalendarDays,
    );

    const actual = round2(
      Math.max(
        0,
        month.rate - leaveReduction - l4Reduction,
      ) + leavePayment,
    );

    // Fixed monthly remuneration is restored to the amount that would have
    // been payable without the sickness absence. Vacation remuneration stays
    // in the amount actually paid for the vacation period.
    const supplemented = round2(
      Math.max(0, month.rate - leaveReduction)
        + leavePayment,
    );

    return { actual, supplemented };
  }

  const actual = round2(
    actualWorkDays * month.rate * 8
      + leavePayment,
  );

  // An hourly contractual rate is treated as fixed remuneration for the
  // supplementation rule. Only the missing L4 working time is restored.
  const supplemented = round2(
    actual + l4WorkingDays * month.rate * 8,
  );

  return { actual, supplemented };
};

const getFunctionalAllowanceSocialGross = (
  month: UopSicknessHistoryMonth,
) => {
  const allowance = Math.max(0, month.functionalAllowance);
  const l4CalendarDays = countCalendarDays(
    month.l4,
    month.year,
    month.month,
  );

  const sicknessShare = round2(
    Math.min(
      allowance,
      (allowance / 30) * l4CalendarDays,
    ),
  );

  // With the current payroll engine, the sickness-period share is outside the
  // social-insurance base whether it is unpaid or retained during sickness.
  return round2(Math.max(0, allowance - sicknessShare));
};

const getActualSocialGross = (
  month: UopSicknessHistoryMonth,
  warnings: UopSicknessBaseMessage[],
) => {
  const regular = getRegularGross(month).actual;
  const overtime = getOvertimeGross(month, warnings);
  const functionalAllowance = getFunctionalAllowanceSocialGross(month);
  const bonuses = month.bonuses.reduce(
    (sum, bonus) => sum + Math.max(0, bonus.amount),
    0,
  );

  return calculateUopSocialInsuranceBase({
    grossComponents: [regular, overtime, functionalAllowance, bonuses],
  });
};

const getEffectiveEmployeeContributionRate = (
  month: UopSicknessHistoryMonth,
  warnings: UopSicknessBaseMessage[],
) => {
  const actualSocialGross = getActualSocialGross(month, warnings);
  if (actualSocialGross <= 0) {
    return employeeSocialInsuranceRate;
  }

  const annualLimit = getAnnualPensionDisabilityLimit(month.year, month.month);
  if (annualLimit == null) {
    warnings.push({
      id: "l4-base-warning-unsupported-historical-zus-cap",
      values: { period: periodKey(month.year, month.month) },
    });
    return employeeSocialInsuranceRate;
  }

  const pensionDisabilityBase = calculateUopPensionDisabilityBase({
    socialInsuranceBase: actualSocialGross,
    previousPensionDisabilityBase: month.previousPensionDisabilityBase,
    annualLimit,
  });

  if (
    month.pensionDisabilityBaseCalculated != null
    && Math.abs(
      month.pensionDisabilityBaseCalculated - pensionDisabilityBase
    ) > 0.02
  ) {
    addWarningOnce(warnings, {
      id: "l4-base-warning-history-social-base-mismatch",
      values: { period: periodKey(month.year, month.month) },
    });
  }

  const policy = getHistoricalPayrollStatutoryConfig(month.year, month.month);
  if (!policy) return employeeSocialInsuranceRate;
  const employeeContributions = round2(
    percent(
      pensionDisabilityBase,
      policy.zusPensionInsurance + policy.zusDisability,
    )
      + percent(actualSocialGross, policy.zusSicknessInsurance),
  );

  return actualSocialGross > 0
    ? (employeeContributions / actualSocialGross) * 100
    : employeeSocialInsuranceRate;
};

const addWarningOnce = (
  warnings: UopSicknessBaseMessage[],
  warning: UopSicknessBaseMessage,
) => {
  const signature = `${warning.id}:${JSON.stringify(warning.values ?? {})}`;
  const exists = warnings.some(
    (item) =>
      `${item.id}:${JSON.stringify(item.values ?? {})}` === signature,
  );

  if (!exists) warnings.push(warning);
};

const isBonusIncludedForContext = (
  bonus: UopSicknessHistoryBonus,
  context: UopSicknessContext,
  warnings: UopSicknessBaseMessage[],
  period: string,
) => {
  const resolved = resolveBonusTreatments(bonus).sickLeaveTreatment;
  if (resolved.source === 'default') {
    addWarningOnce(warnings, {
      id: "l4-base-note-bonus-treatment-auto",
      values: { bonus: bonus.name || "—", period },
    });
  }

  return !(context === "duringInsurance" && resolved.value === "paidInFull");
};

const supplementBonusGross = (
  amount: number,
  treatment: UopSicknessHistoryBonus["sickLeaveTreatment"],
  requiredWorkDays: number,
  workedEquivalentDays: number,
) => {
  if (
    treatment !== "proportional"
    || requiredWorkDays <= 0
    || workedEquivalentDays <= 0
    || workedEquivalentDays >= requiredWorkDays
  ) {
    return round2(amount);
  }

  return round2(
    amount * requiredWorkDays / workedEquivalentDays,
  );
};

const getFirstFullEmploymentMonth = (startDate: string) => {
  const start = dayjs(startDate);
  const startOfMonth = start.startOf("month");

  return start.isSame(startOfMonth, "day")
    ? startOfMonth
    : startOfMonth.add(1, "month");
};

const getContext = (
  targetL4: ISODateRange[],
  relationEndDate: string | null,
): UopSicknessContext => {
  if (targetL4.length === 0) {
    throw new UopSicknessBaseError("l4-base-error-no-l4");
  }

  if (!relationEndDate) return "duringInsurance";

  const end = dayjs(relationEndDate);
  const hasDuringInsurance = targetL4.some(
    (range) => !dayjs(range.start).isAfter(end, "day"),
  );
  const hasAfterInsurance = targetL4.some(
    (range) => dayjs(range.end).isAfter(end, "day"),
  );

  if (hasDuringInsurance && hasAfterInsurance) {
    throw new UopSicknessBaseError(
      "l4-base-error-mixed-insurance-context",
      { endDate: end.format("DD.MM.YYYY") },
    );
  }

  return hasAfterInsurance
    ? "afterInsurance"
    : "duringInsurance";
};

const getCurrentFirstL4Start = (
  ranges: ISODateRange[],
) => [...ranges]
  .map((range) => range.start)
  .sort()[0] ?? null;

const getReusablePreviousBase = (
  history: UopSicknessBaseHistory,
  currentL4Start: string,
  context: UopSicknessContext,
) => {
  // The post-employment context can change component inclusion rules, so do
  // not blindly reuse a base originally established during employment.
  if (context !== "duringInsurance") return null;

  const candidates = history.months
    .filter((month) => month.l4Base > 0 && month.l4.length > 0)
    .flatMap((month) =>
      month.l4.map((range) => ({
        month,
        rangeEnd: range.end,
      })),
    )
    .filter((item) => item.rangeEnd < currentL4Start)
    .sort((a, b) => b.rangeEnd.localeCompare(a.rangeEnd));

  const latest = candidates[0];
  if (!latest) return null;

  const previousEnd = dayjs(latest.rangeEnd);
  const currentStart = dayjs(currentL4Start);
  const monthDistance =
    (currentStart.year() - previousEnd.year()) * 12
      + currentStart.month()
      - previousEnd.month();

  if (monthDistance > 1) return null;

  return {
    base: latest.month.l4Base,
    period: periodKey(latest.month.year, latest.month.month),
  };
};

const getQuarterStart = (date: dayjs.Dayjs) => {
  const startMonth = Math.floor(date.month() / 3) * 3;
  return date.month(startMonth).date(1).startOf("day");
};

const getPeriodWorkStats = (
  months: UopSicknessHistoryMonth[],
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
) => {
  let requiredWorkDays = 0;
  let workedEquivalentDays = 0;

  months.forEach((month) => {
    const date = toMonthDate(month);
    if (date.isBefore(start, "month") || date.isAfter(end, "month")) {
      return;
    }

    const stats = getMonthWorkStats(month);
    requiredWorkDays += stats.requiredWorkDays;
    workedEquivalentDays += stats.workedEquivalentDays;
  });

  return { requiredWorkDays, workedEquivalentDays };
};

const getLongPeriodShare = (
  history: UopSicknessBaseHistory,
  context: UopSicknessContext,
  frequency: "quarterly" | "annual",
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  warnings: UopSicknessBaseMessage[],
) => {
  let totalNet = 0;

  history.months.forEach((month) => {
    const date = toMonthDate(month);
    if (date.isBefore(start, "month") || date.isAfter(end, "month")) {
      return;
    }

    const contributionRate = getEffectiveEmployeeContributionRate(
      month,
      warnings,
    );

    month.bonuses
      .filter((bonus) => bonus.frequency === frequency)
      .forEach((bonus) => {
        if (!bonus.bonusDefinitionId) {
          addWarningOnce(warnings, {
            id: "l4-base-warning-long-period-bonus-without-definition",
            values: {
              bonus: bonus.name || "—",
              period: periodKey(month.year, month.month),
            },
          });
        }
        if (
          !isBonusIncludedForContext(
            bonus,
            context,
            warnings,
            periodKey(month.year, month.month),
          )
        ) {
          return;
        }

        let periodStats;

        if (frequency === "quarterly") {
          const quarterStart = getQuarterStart(date);
          periodStats = getPeriodWorkStats(
            history.months,
            quarterStart,
            quarterStart.add(2, "month"),
          );
        } else {
          const yearStart = date.startOf("year");
          periodStats = getPeriodWorkStats(
            history.months,
            yearStart,
            yearStart.endOf("year"),
          );
        }

        const gross = supplementBonusGross(
          Math.max(0, bonus.amount),
          resolveBonusTreatments(bonus).sickLeaveTreatment.value,
          periodStats.requiredWorkDays,
          periodStats.workedEquivalentDays,
        );

        totalNet += gross * (1 - contributionRate / 100);
      });
  });

  return round2(totalNet / 12);
};

const getCurrentMonthFallback = (
  params: CalculateUopSicknessBaseParams,
  context: UopSicknessContext,
  warnings: UopSicknessBaseMessage[],
) => {
  const { target } = params;

  const syntheticMonth: UopSicknessHistoryMonth = {
    salaryId: "current-month",
    year: target.year,
    month: target.month,
    paymentMode: target.paymentMode,
    employmentStartDate:
      target.employmentStartDate
        ?? monthStart(target.year, target.month).format("YYYY-MM-DD"),
    employmentEndDate:
      target.employmentEndDate
        ?? monthStart(target.year, target.month).endOf("month").format("YYYY-MM-DD"),
    grossSalaryCalculated: 0,
    pensionDisabilityBaseCalculated: null,
    rate: target.rate,
    workingHours: target.workingHours,
    previousPensionDisabilityBase: 0,
    holidays: target.holidays ?? [],
    dailyOvertime: target.dailyOvertime ?? 0,
    weekendHolidayOvertime: target.weekendHolidayOvertime ?? 0,
    nightOvertime: target.nightOvertime ?? 0,
    nightHours: target.nightHours ?? 0,
    turnOfDayHours: target.turnOfDayHours ?? 0,
    l4: target.l4,
    l4Base: 0,
    leave: target.leave ?? [],
    leaveBase: target.leaveBase ?? 0,
    functionalAllowance: target.functionalAllowance ?? 0,
    functionalAllowanceRetainedDuringSickness:
      target.functionalAllowanceRetainedDuringSickness ?? false,
    calculationSettings: {
      hourlyRateCalculationMode:
        target.hourlyRateCalculationMode ?? "roundedTo2",
    },
    bonuses: [],
  };

  const stats = getMonthWorkStats(syntheticMonth);
  let gross = getRegularGross(syntheticMonth).supplemented;

  const functionalAllowance = Math.max(
    0,
    target.functionalAllowance ?? 0,
  );

  if (
    context === "afterInsurance"
    || !target.functionalAllowanceRetainedDuringSickness
  ) {
    gross += functionalAllowance;
  }

  gross += getOvertimeGross(syntheticMonth, warnings);

  (target.bonuses ?? []).forEach((bonus) => {
    const resolved = resolveBonusTreatments(bonus).sickLeaveTreatment;
    if (resolved.source === 'default') {
      addWarningOnce(warnings, {
        id: "l4-base-note-current-bonus-treatment-auto",
        values: { bonus: bonus.name || "—" },
      });
    }
    if (context === "duringInsurance" && resolved.value === "paidInFull") {
      return;
    }

    if (bonus.frequency === "monthly" || bonus.frequency === "oneOff") {
      gross += supplementBonusGross(
        Math.max(0, bonus.amount),
        resolved.value,
        stats.requiredWorkDays,
        stats.workedEquivalentDays,
      );
    }
  });

  return round2(gross * (1 - employeeSocialInsuranceRate / 100));
};

const getRetainedCurrentComponentsNet = (
  params: CalculateUopSicknessBaseParams,
  context: UopSicknessContext,
) => {
  if (context !== "duringInsurance") return 0;

  let gross = params.target.functionalAllowanceRetainedDuringSickness
    ? Math.max(0, params.target.functionalAllowance ?? 0)
    : 0;

  (params.target.bonuses ?? []).forEach((bonus) => {
    if (resolveBonusTreatments(bonus).sickLeaveTreatment.value === "paidInFull") {
      gross += Math.max(0, bonus.amount);
    }
  });

  return round2(
    gross * (1 - employeeSocialInsuranceRate / 100),
  );
};

const getMinimumBase = (
  params: CalculateUopSicknessBaseParams,
  context: UopSicknessContext,
  warnings: UopSicknessBaseMessage[],
) => {
  const minimumWage = getMinimumWage(
    params.target.year,
    params.target.month,
  );

  if (minimumWage == null) {
    warnings.push({
      id: "l4-base-warning-minimum-base-not-applied",
      values: {
        period: periodKey(params.target.year, params.target.month),
      },
    });
    return null;
  }

  const fullMinimum = round2(
    minimumWage * (1 - employeeSocialInsuranceRate / 100),
  );

  // For a component retained during sickness, the statutory minimum test is
  // reduced by that component because it remains payable outside the benefit
  // base during insurance.
  const retainedNet = getRetainedCurrentComponentsNet(params, context);

  return round2(Math.max(0, fullMinimum - retainedNet));
};

export const calculateUopSicknessBase = (
  params: CalculateUopSicknessBaseParams,
): UopSicknessBaseResult => {
  const warnings: UopSicknessBaseMessage[] = [];
  const { history, target } = params;

  const targetStart = monthStart(target.year, target.month);
  const targetEnd = targetStart.endOf("month");

  const context = getContext(
    target.l4,
    history.relation.endDate,
  );

  const firstCurrentL4Start = getCurrentFirstL4Start(target.l4);
  if (!firstCurrentL4Start) {
    throw new UopSicknessBaseError("l4-base-error-no-l4");
  }

  const reusable = getReusablePreviousBase(
    history,
    firstCurrentL4Start,
    context,
  );

  const firstFullEmploymentMonth = getFirstFullEmploymentMonth(
    history.relation.startDate,
  );

  const twelveMonthsBefore = targetStart.subtract(12, "month");
  const monthlyReferenceStart =
    firstFullEmploymentMonth.isAfter(twelveMonthsBefore, "month")
      ? firstFullEmploymentMonth
      : twelveMonthsBefore;
  const monthlyReferenceEnd = targetStart.subtract(1, "month");

  const quarterStart = getQuarterStart(targetStart);
  const quarterlyReferenceStart = quarterStart.subtract(12, "month");
  const quarterlyReferenceEnd = quarterStart.subtract(1, "day");

  const annualYear = target.year - 1;
  const annualReferenceStart = dayjs(`${annualYear}-01-01`);
  const annualReferenceEnd = dayjs(`${annualYear}-12-31`);

  const missingPeriods = history.missingPeriods.filter((period) => {
    const date = dayjs(`${period}-01`);
    return !date.isAfter(targetEnd, "month");
  });

  if (missingPeriods.length > 0) {
    warnings.push({
      id: "l4-base-warning-missing-history",
      values: { periods: missingPeriods.join(", ") },
    });
  }

  let source: UopSicknessBaseResult["source"] = "history";
  let reusedFromPeriod: string | undefined;
  let monthlyAverage = 0;
  let quarterlyShare = 0;
  let annualShare = 0;
  let monthDetails: UopSicknessBaseMonthDetail[] = [];
  let usedPeriods: string[] = [];
  let excludedPeriods: string[] = [];
  let calculatedBaseBeforeMinimum = 0;

  if (reusable) {
    source = "reusedPreviousBase";
    reusedFromPeriod = reusable.period;
    calculatedBaseBeforeMinimum = round2(reusable.base);
  } else {
    const monthlyCandidates = history.months.filter((month) => {
      const date = toMonthDate(month);
      return (
        !date.isBefore(monthlyReferenceStart, "month")
        && !date.isAfter(monthlyReferenceEnd, "month")
      );
    });

    if (
      monthlyReferenceStart.isAfter(monthlyReferenceEnd, "month")
      || monthlyCandidates.length === 0
    ) {
      source = "currentMonthFallback";
      monthlyAverage = getCurrentMonthFallback(
        params,
        context,
        warnings,
      );
      calculatedBaseBeforeMinimum = monthlyAverage;
    } else {
      const rawStats = monthlyCandidates.map((month) => ({
        month,
        ...getMonthWorkStats(month),
      }));

      const hasAtLeastHalfMonth = rawStats.some(
        (item) =>
          item.requiredWorkDays === 0
          || item.workedEquivalentDays * 2 >= item.requiredWorkDays,
      );

      rawStats.forEach((item) => {
        const period = periodKey(item.month.year, item.month.month);
        const belowHalf =
          item.requiredWorkDays > 0
          && item.workedEquivalentDays * 2 < item.requiredWorkDays;
        const included = !belowHalf || !hasAtLeastHalfMonth;

        if (!included) {
          excludedPeriods.push(period);
          monthDetails.push({
            period,
            requiredWorkDays: item.requiredWorkDays,
            workedEquivalentDays: item.workedEquivalentDays,
            included: false,
            supplemented: false,
            grossIncluded: 0,
            employeeContributionRate: 0,
            netIncluded: 0,
          });
          return;
        }

        const hasSicknessReduction =
          item.workedEquivalentDays < item.requiredWorkDays;
        const regular = getRegularGross(item.month);
        const regularGross = hasSicknessReduction
          ? regular.supplemented
          : regular.actual;

        let grossIncluded = regularGross;

        if (
          context === "afterInsurance"
          || !item.month.functionalAllowanceRetainedDuringSickness
        ) {
          grossIncluded += Math.max(0, item.month.functionalAllowance);
        }

        grossIncluded += getOvertimeGross(item.month, warnings);

        item.month.bonuses
          .filter(
            (bonus) =>
              bonus.frequency === "monthly"
              || bonus.frequency === "oneOff",
          )
          .forEach((bonus) => {
            if (
              !isBonusIncludedForContext(
                bonus,
                context,
                warnings,
                period,
              )
            ) {
              return;
            }

            grossIncluded += supplementBonusGross(
              Math.max(0, bonus.amount),
              resolveBonusTreatments(bonus).sickLeaveTreatment.value,
              item.requiredWorkDays,
              item.workedEquivalentDays,
            );
          });

        grossIncluded = round2(grossIncluded);

        const employeeContributionRate =
          getEffectiveEmployeeContributionRate(
            item.month,
            warnings,
          );

        const netIncluded = round2(
          grossIncluded * (1 - employeeContributionRate / 100),
        );

        usedPeriods.push(period);
        monthDetails.push({
          period,
          requiredWorkDays: item.requiredWorkDays,
          workedEquivalentDays: item.workedEquivalentDays,
          included: true,
          supplemented: hasSicknessReduction,
          grossIncluded,
          employeeContributionRate: round2(employeeContributionRate),
          netIncluded,
        });
      });

      const includedValues = monthDetails
        .filter((item) => item.included)
        .map((item) => item.netIncluded);

      if (includedValues.length === 0) {
        throw new UopSicknessBaseError(
          "l4-base-error-no-usable-history",
        );
      }

      monthlyAverage = round2(
        includedValues.reduce((sum, value) => sum + value, 0)
          / includedValues.length,
      );

      quarterlyShare = getLongPeriodShare(
        history,
        context,
        "quarterly",
        quarterlyReferenceStart,
        quarterlyReferenceEnd,
        warnings,
      );

      annualShare = getLongPeriodShare(
        history,
        context,
        "annual",
        annualReferenceStart,
        annualReferenceEnd,
        warnings,
      );

      calculatedBaseBeforeMinimum = round2(
        monthlyAverage + quarterlyShare + annualShare,
      );
    }
  }

  const minimumBase = getMinimumBase(
    params,
    context,
    warnings,
  );

  const minimumApplied =
    minimumBase != null
    && calculatedBaseBeforeMinimum < minimumBase;

  const baseBeforePostTerminationCap = round2(
    minimumApplied
      ? minimumBase!
      : calculatedBaseBeforeMinimum,
  );
  // Art. 46 limits the base for benefits after the end of insurance.
  // The same effective-dated table is shared with UZ; never guess a future cap.
  const postTerminationCap = context === 'afterInsurance'
    ? getPostTerminationBenefitCap(target.year, target.month)
    : null;
  if (context === 'afterInsurance' && postTerminationCap === null) {
    throw new UopSicknessBaseError('l4-base-error-post-termination-limit', {
      period: periodKey(target.year, target.month),
    });
  }
  const base = postTerminationCap === null
    ? baseBeforePostTerminationCap
    : round2(Math.min(baseBeforePostTerminationCap, postTerminationCap));

  return {
    base,
    calculatedBaseBeforeMinimum,
    minimumBase,
    minimumApplied,
    context,
    source,
    reusedFromPeriod,

    monthlyAverage,
    quarterlyShare,
    annualShare,

    referencePeriod: {
      monthlyStart:
        monthlyReferenceStart.isAfter(monthlyReferenceEnd, "month")
          ? null
          : monthlyReferenceStart.format("YYYY-MM"),
      monthlyEnd:
        monthlyReferenceStart.isAfter(monthlyReferenceEnd, "month")
          ? null
          : monthlyReferenceEnd.format("YYYY-MM"),
      quarterlyStart: quarterlyReferenceStart.format("YYYY-MM"),
      quarterlyEnd: quarterlyReferenceEnd.format("YYYY-MM"),
      annualYear,
    },

    usedPeriods,
    excludedPeriods,
    missingPeriods,
    monthDetails,
    warnings,
  };
};

/**
 * Calculate both L4 bases independently. Do not feed mixed-context L4 ranges
 * into calculateUopSicknessBase(), which intentionally accepts one context.
 * The original calculation and its rounding/bonus rules are preserved.
 */
export const calculateUopSicknessBases = (
  params: CalculateUopSicknessBaseParams,
): UopSicknessBasesResult => {
  const endDate = params.history.relation.endDate;
  const duringRanges: typeof params.target.l4 = [];
  const afterRanges: typeof params.target.l4 = [];

  params.target.l4.forEach((range) => {
    if (!endDate || range.start <= endDate) {
      duringRanges.push({
        ...range,
        end: endDate && range.end > endDate ? endDate : range.end,
      });
    }

    if (endDate && range.end > endDate) {
      const nextDay = dayjs(endDate).add(1, 'day').format('YYYY-MM-DD');
      afterRanges.push({
        ...range,
        start: range.start > nextDay ? range.start : nextDay,
      });
    }
  });

  return {
    duringEmployment: duringRanges.length > 0
      ? calculateUopSicknessBase({
          ...params,
          target: { ...params.target, l4: duringRanges },
        })
      : null,
    afterEmployment: afterRanges.length > 0
      ? calculateUopSicknessBase({
          ...params,
          target: { ...params.target, l4: afterRanges },
        })
      : null,
  };
};
