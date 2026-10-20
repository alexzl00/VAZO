import { supabase } from '../lib/supabase';
import { normalizeL4Ranges } from '../types/salaryCalculator';
import type { SalaryBonus } from '../types/salaryCalculator';
import type { MandateSicknessBaseHistory, MandateSicknessHistoryMonth } from '../types/mandateSicknessBase';
import type { ISODateRange } from '../utils/monthHelperFunc';

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
const asMoney = (value: unknown): number => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) throw new Error('Invalid historical financial value');
  return number;
};
const asNullableMoney = (value: unknown): number | null => value == null ? null : asMoney(value);
const asRanges = (value: unknown): ISODateRange[] => Array.isArray(value)
  ? value.filter((range): range is ISODateRange =>
    !!range && typeof range === 'object'
    && typeof range.start === 'string' && typeof range.end === 'string')
  : [];
const asL4 = (value: unknown) => normalizeL4Ranges(asRanges(value).map(range => {
  const value = asRecord(range);
  return {
    ...range,
    paymentType: typeof value.paymentType === 'string'
      ? value.paymentType
      : typeof value.payment_type === 'string'
        ? value.payment_type
        : undefined,
  };
}));

const asBonus = (raw: unknown): SalaryBonus => {
  const b = asRecord(raw);
  return {
    id: String(b.id ?? ''),
    bonusDefinitionId: b.bonusDefinitionId == null ? null : String(b.bonusDefinitionId),
    name: String(b.name ?? ''),
    amount: asMoney(b.amount),
    frequency: b.frequency === 'quarterly' || b.frequency === 'annual' || b.frequency === 'oneOff'
      ? b.frequency : 'monthly',
    paymentType: b.paymentType === 'nonCash' ? 'nonCash' : 'cash',
    amountType: b.amountType === 'variable' ? 'variable' : b.amountType === 'fixed' ? 'fixed' : undefined,
    sickLeaveTreatment: b.sickLeaveTreatment === 'paidInFull'
      || b.sickLeaveTreatment === 'proportional'
      || b.sickLeaveTreatment === 'nonProportional'
      || b.sickLeaveTreatment === 'notPaid' ? b.sickLeaveTreatment : undefined,
    vacationTreatment: b.vacationTreatment === 'paidInFull'
      || b.vacationTreatment === 'variableBase'
      || b.vacationTreatment === 'excluded' ? b.vacationTreatment : undefined,
  };
};
const asMonth = (raw: unknown): MandateSicknessHistoryMonth => {
  const m = asRecord(raw);
  if (m.paymentMode !== 'hourly') throw new Error('Unsupported mandate history payment mode');
  return {
    salaryId: String(m.salaryId ?? ''),
    year: asMoney(m.year), month: asMoney(m.month), paymentMode: 'hourly',
    engineId: String(m.engineId ?? ''), inputSchemaId: String(m.inputSchemaId ?? ''),
    employmentStartDate: m.employmentStartDate == null ? null : String(m.employmentStartDate),
    employmentEndDate: m.employmentEndDate == null ? null : String(m.employmentEndDate),
    grossSalaryCalculated: asMoney(m.grossSalaryCalculated),
    pensionDisabilityBaseCalculated: asNullableMoney(m.pensionDisabilityBaseCalculated),
    rate: asMoney(m.rate), workingHours: asMoney(m.workingHours),
    isStudent: m.isStudent === true, isUnder26: m.isUnder26 === true,
    mandateVoluntarySicknessInsurance: m.mandateVoluntarySicknessInsurance === true,
    sicknessBenefitEligible: m.sicknessBenefitEligible === true,
    mandateHasOtherUopAtLeastMinimumBase: m.mandateHasOtherUopAtLeastMinimumBase === true,
    mandateOtherSocialBaseBeforeThisContract: asMoney(m.mandateOtherSocialBaseBeforeThisContract),
    isOwnEmployerContract: m.isOwnEmployerContract === true,
    performedForOwnEmployer: m.performedForOwnEmployer === true,
    previousPensionDisabilityBase: asMoney(m.previousPensionDisabilityBase),
    holidays: asRanges(m.holidays), l4: asL4(m.l4),
    l4Base: asMoney(m.l4Base), l4BaseAfterTermination: asNullableMoney(m.l4BaseAfterTermination),
    bonuses: Array.isArray(m.bonuses) ? m.bonuses.map(asBonus) : [],
    calculationSettings: asRecord(m.calculationSettings),
  };
};

export const getMandateSicknessBaseHistory = async (
  workRelationId: string, year: number, month: number,
): Promise<MandateSicknessBaseHistory> => {
  const { data, error } = await supabase.rpc('get_mandate_sickness_base_history', {
    p_work_relation_id: workRelationId, p_year: year, p_month: month,
  });
  if (error) throw error;
  if (!data || typeof data !== 'object') throw new Error('Mandate sickness history was not returned');
  const result = asRecord(data);
  const relation = asRecord(result.relation);
  if (relation.paymentMode !== 'hourly') throw new Error('Unsupported mandate relation payment mode');
  return {
    relation: {
      id: String(relation.id ?? workRelationId),
      startDate: String(relation.startDate ?? ''),
      endDate: relation.endDate == null ? null : String(relation.endDate),
      paymentMode: 'hourly',
    },
    historyStart: String(result.historyStart ?? ''),
    historyEnd: String(result.historyEnd ?? ''),
    missingPeriods: Array.isArray(result.missingPeriods)
      ? result.missingPeriods.filter((value): value is string => typeof value === 'string') : [],
    months: Array.isArray(result.months) ? result.months.map(asMonth) : [],
  };
};
