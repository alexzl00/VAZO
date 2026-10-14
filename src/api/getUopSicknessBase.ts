import { supabase } from "../lib/supabase";
import { normalizeL4Ranges } from "../types/salaryCalculator";
import type { L4Range } from "../types/salaryCalculator";
import type { ISODateRange } from "../utils/monthHelperFunc";
import type {
  UopSicknessBaseHistory,
  UopSicknessHistoryBonus,
  UopSicknessHistoryMonth,
} from "../types/uopSicknessBase";

const toNumber = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toIsoRanges = (value: unknown): ISODateRange[] =>
  Array.isArray(value)
    ? value
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item)
            && typeof item === "object"
            && typeof item.start === "string"
            && typeof item.end === "string",
        )
        .map((item) => ({
          start: String(item.start),
          end: String(item.end),
        }))
    : [];

const toL4Ranges = (value: unknown): L4Range[] => {
  if (!Array.isArray(value)) return [];

  const ranges = value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item)
        && typeof item === "object"
        && typeof item.start === "string"
        && typeof item.end === "string",
    )
    .map((item) => ({
      start: String(item.start),
      end: String(item.end),
      paymentType:
        typeof item.paymentType === "string"
          ? item.paymentType
          : typeof item.payment_type === "string"
            ? item.payment_type
            : undefined,
    }));

  return normalizeL4Ranges(ranges);
};

const mapBonus = (value: any): UopSicknessHistoryBonus => ({
  id: String(value.id ?? ""),
  bonusDefinitionId:
    value.bonusDefinitionId == null
      ? null
      : String(value.bonusDefinitionId),
  name: String(value.name ?? ""),
  amount: toNumber(value.amount),
  frequency:
    value.frequency === "quarterly" ||
    value.frequency === "annual" ||
    value.frequency === "oneOff"
      ? value.frequency
      : "monthly",
  paymentType: value.paymentType === "nonCash" ? "nonCash" : "cash",
  amountType:
    value.amountType === "fixed" || value.amountType === "variable"
      ? value.amountType
      : null,
  sickLeaveTreatment:
    value.sickLeaveTreatment === "paidInFull" ||
    value.sickLeaveTreatment === "proportional" ||
    value.sickLeaveTreatment === "nonProportional" ||
    value.sickLeaveTreatment === "notPaid"
      ? value.sickLeaveTreatment
      : null,
  sortOrder: toNumber(value.sortOrder),
});

const mapMonth = (value: any): UopSicknessHistoryMonth => ({
  salaryId: String(value.salaryId ?? ""),
  year: toNumber(value.year),
  month: toNumber(value.month),
  paymentMode: value.paymentMode === "hourly" ? "hourly" : "monthly",
  employmentStartDate: String(value.employmentStartDate ?? ""),
  employmentEndDate: String(value.employmentEndDate ?? ""),
  grossSalaryCalculated: toNumber(value.grossSalaryCalculated),
  pensionDisabilityBaseCalculated: toNullableNumber(
    value.pensionDisabilityBaseCalculated,
  ),

  rate: toNumber(value.rate),
  workingHours: toNumber(value.workingHours),
  previousPensionDisabilityBase: toNumber(
    value.previousPensionDisabilityBase,
  ),

  holidays: toIsoRanges(value.holidays),
  dailyOvertime: toNumber(value.dailyOvertime),
  weekendHolidayOvertime: toNumber(value.weekendHolidayOvertime),
  nightOvertime: toNumber(value.nightOvertime),
  nightHours: toNumber(value.nightHours),
  turnOfDayHours: toNumber(value.turnOfDayHours),

  l4: toL4Ranges(value.l4),
  l4Base: toNumber(value.l4Base),
  leave: toIsoRanges(value.leave),
  leaveBase: toNumber(value.leaveBase),

  functionalAllowance: toNumber(value.functionalAllowance),
  functionalAllowanceRetainedDuringSickness:
    value.functionalAllowanceRetainedDuringSickness === true,

  calculationSettings:
    value.calculationSettings && typeof value.calculationSettings === "object"
      ? value.calculationSettings
      : {},
  bonuses: Array.isArray(value.bonuses)
    ? value.bonuses.map(mapBonus)
    : [],
});

export async function getUopSicknessBaseHistory(
  workRelationId: string,
  year: number,
  month: number,
): Promise<UopSicknessBaseHistory> {
  const { data, error } = await supabase.rpc(
    "get_uop_sickness_base_history",
    {
      p_work_relation_id: workRelationId,
      p_year: year,
      p_month: month,
    },
  );

  if (error) throw error;

  if (!data || typeof data !== "object") {
    throw new Error("UoP sickness-base history was not returned.");
  }

  const result = data as Record<string, any>;
  const relation =
    result.relation && typeof result.relation === "object"
      ? result.relation as Record<string, any>
      : {};

  return {
    relation: {
      id: String(relation.id ?? workRelationId),
      startDate: String(relation.startDate ?? ""),
      endDate:
        relation.endDate == null ? null : String(relation.endDate),
      paymentMode:
        relation.paymentMode === "hourly" ? "hourly" : "monthly",
    },
    historyStart: String(result.historyStart ?? ""),
    historyEnd: String(result.historyEnd ?? ""),
    missingPeriods: Array.isArray(result.missingPeriods)
      ? result.missingPeriods.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    months: Array.isArray(result.months)
      ? result.months.map(mapMonth)
      : [],
  };
}
