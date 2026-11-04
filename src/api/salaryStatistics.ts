import { supabase } from '../lib/supabase';
import type { SalaryRecord } from './Salaries';
import type { SalaryBonus, SalaryCalculatorValues } from '../types/salaryCalculator';
import { normalizeL4Ranges } from '../types/salaryCalculator';
import type { StatisticsSalary, StatisticsPeriod, AnnualFactRecord } from '../utils/salaryStatistics';
import { toGrosz } from '../utils/salaryStatistics';
import { isSupportedPayrollYear, PAYROLL_DEFAULTS } from '../utils/statutory/payrollStatutoryConfig';
import {
  calculateTaxesContractOfMandate, calculateTaxesUoD, calculateTaxesUoP,
} from '../utils/workTypeSalaryCalc';

/** All statistics queries are ordinary SELECTs; no new database procedures or migrations. */
type Embedded<T> = T | T[] | null;
const first = <T>(value: Embedded<T>): T | null => Array.isArray(value) ? value[0] ?? null : value;
const numberOr = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error('Invalid saved numeric value');
  return n;
};
const optionalMoney = (value: unknown): number | null => value == null ? null : numberOr(value);
const dateRanges = (value: unknown): SalaryCalculatorValues['leave'] =>
  Array.isArray(value) ? value as SalaryCalculatorValues['leave'] : [];
const settings = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const selectSalary = `
  id, work_relation_id, year, month, contract_type, payment_mode,
  engine_id, input_schema_id, gross_salary_calculated, net_salary_calculated,
  employment_start_date, employment_end_date,
  salary_overrides (gross_salary_override, net_salary_override),
  salary_uop_inputs (*), salary_mandate_inputs (*), salary_uod_inputs (*),
  salary_bonuses (id, bonus_definition_id, name, amount, frequency, payment_type,
    amount_type, sick_leave_treatment, vacation_treatment),
  salary_calculation_settings (settings)
`;

type RawSalary = {
  id: SalaryRecord['id']; work_relation_id: SalaryRecord['workRelationId'];
  year: SalaryRecord['year']; month: SalaryRecord['month'];
  contract_type: SalaryRecord['contractType']; payment_mode: SalaryRecord['paymentMode'];
  engine_id: string; input_schema_id: string;
  gross_salary_calculated: number | string | null; net_salary_calculated: number | string | null;
  employment_start_date: string | null; employment_end_date: string | null;
  salary_overrides: Embedded<{ gross_salary_override: number | string | null; net_salary_override: number | string | null }>;
  salary_uop_inputs: Embedded<Record<string, unknown>>;
  salary_mandate_inputs: Embedded<Record<string, unknown>>;
  salary_uod_inputs: Embedded<Record<string, unknown>>;
  salary_bonuses: Array<Record<string, unknown>> | null;
  salary_calculation_settings: Embedded<{ settings: unknown }>;
};

function mapBonus(item: Record<string, unknown>): SalaryBonus {
  return {
    id: String(item.id), name: String(item.name), amount: numberOr(item.amount),
    frequency: item.frequency as SalaryBonus['frequency'],
    paymentType: (item.payment_type ?? 'cash') as SalaryBonus['paymentType'],
    amountType: (item.amount_type ?? undefined) as SalaryBonus['amountType'],
    sickLeaveTreatment: (item.sick_leave_treatment ?? undefined) as SalaryBonus['sickLeaveTreatment'],
    vacationTreatment: (item.vacation_treatment ?? undefined) as SalaryBonus['vacationTreatment'],
    bonusDefinitionId: item.bonus_definition_id == null ? null : String(item.bonus_definition_id),
  };
}
/** Rehydrate a persisted payroll using exactly the input fields used by UpdateSalary.
 * The existing payroll engine remains the only calculation implementation.
 */
function replaySavedSalary(row: RawSalary, inputs: Record<string, unknown>, bonuses: SalaryBonus[], options: Record<string, unknown>) {
  if (!isSupportedPayrollYear(row.year) || row.engine_id !== 'pl-2026-v1' || row.input_schema_id !== 'salary-input-v1') return null;
  const workRateType = `${row.contract_type}_${row.payment_mode}` as SalaryCalculatorValues['workRateType'];
  if (!(['uop_monthly', 'uop_hourly', 'mandate_hourly', 'uod_fixed'] as string[]).includes(workRateType)) return null;
  const values: SalaryCalculatorValues = {
    year: row.year, month: row.month, workRateType,
    workRelationId: row.work_relation_id,
    employmentStartDate: row.employment_start_date,
    employmentEndDate: row.employment_end_date,
    rate: numberOr(inputs.rate), workingHours: numberOr(inputs.working_hours),
    bonuses,
    holidays: dateRanges(inputs.holidays),
    l4: normalizeL4Ranges(dateRanges(inputs.l4)),
    leave: dateRanges(inputs.leave),
    dailyOvertime: numberOr(inputs.daily_overtime),
    weekendHolidayOvertime: numberOr(inputs.weekend_holiday_overtime),
    nightOvertime: numberOr(inputs.night_overtime),
    nightHours: numberOr(inputs.night_hours),
    turnOfDayHours: numberOr(inputs.turn_of_day_hours),
    overtimeLimit: numberOr(inputs.overtime_limit, 30),
    l4Base: numberOr(inputs.l4_base),
    l4BaseAfterTermination: optionalMoney(inputs.l4_base_after_termination),
    leaveBase: numberOr(inputs.leave_base),
    vacationBaseMonths: inputs.vacation_base_months === 12 ? 12 : 3,
    isStudent: Boolean(inputs.is_student),
    isUnder26: Boolean(inputs.is_under_26),
    kup: inputs.kup === 50 ? 50 : 20,
    uopKup: (inputs.uop_kup ?? PAYROLL_DEFAULTS.uopKup) as SalaryCalculatorValues['uopKup'],
    hasMultipleEmploymentRelationships: Boolean(inputs.has_multiple_employment_relationships),
    pit2MonthlyReduction: (inputs.pit2_monthly_reduction ?? 0) as SalaryCalculatorValues['pit2MonthlyReduction'],
    pit0Relief: (inputs.pit0_relief ?? 'none') as SalaryCalculatorValues['pit0Relief'],
    previousTaxableIncome: numberOr(inputs.previous_taxable_income),
    previousPit0Revenue: numberOr(inputs.previous_pit0_revenue),
    previousPensionDisabilityBase: numberOr(inputs.previous_pension_disability_base),
    previous50KupUsed: numberOr(inputs.previous_copyright_kup_used),
    previousUopKupUsed: numberOr(inputs.previous_uop_kup_used),
    doNotWithholdPitAdvance: Boolean(inputs.do_not_withhold_pit_advance),
    sicknessBenefitEligible: inputs.sickness_benefit_eligible == null
      ? row.contract_type === 'uop' : Boolean(inputs.sickness_benefit_eligible),
    uopEmployerSickPayLimit: (inputs.uop_employer_sick_pay_limit ?? PAYROLL_DEFAULTS.employerSickPayLimit) as SalaryCalculatorValues['uopEmployerSickPayLimit'],
    previousEmployerSickPayDays: numberOr(inputs.previous_employer_sick_pay_days),
    mandateVoluntarySicknessInsurance: Boolean(inputs.mandate_voluntary_sickness_insurance),
    mandateHasOtherUopAtLeastMinimumBase: Boolean(inputs.mandate_has_other_uop_at_least_minimum_base),
    mandateOtherSocialBaseBeforeThisContract: numberOr(inputs.mandate_other_social_base_before_this_contract),
    isOwnEmployerContract: Boolean(inputs.is_own_employer_contract),
    performedForOwnEmployer: Boolean(inputs.performed_for_own_employer),
    smallContractLumpSumEligible: Boolean(inputs.small_contract_lump_sum_eligible),
    ppkEnabled: Boolean(inputs.ppk_enabled),
    ppkEmployeeRate: numberOr(inputs.ppk_employee_rate, PAYROLL_DEFAULTS.ppkEmployeeRate),
    ppkEmployerRate: numberOr(inputs.ppk_employer_rate, PAYROLL_DEFAULTS.ppkEmployerRate),
    ppkEmployerTaxableContribution: inputs.ppk_employer_taxable_contribution == null
      ? undefined : numberOr(inputs.ppk_employer_taxable_contribution),
    deductionAfterTax: numberOr(inputs.deduction_after_tax),
    additionAfterTax: numberOr(inputs.addition_after_tax),
    functionalAllowance: numberOr(inputs.functional_allowance),
    functionalAllowanceRetainedDuringSickness: Boolean(inputs.functional_allowance_retained_during_sickness),
    hourlyRateCalculationMode: options.hourlyRateCalculationMode === 'fullPrecision' ? 'fullPrecision' : 'roundedTo2',
    isOverride: false, grossSalaryOverride: null, netSalaryOverride: null, reason: null,
  };
  try {
    const result = workRateType === 'uod_fixed' ? calculateTaxesUoD(values)
      : workRateType === 'mandate_hourly' ? calculateTaxesContractOfMandate(values)
        : calculateTaxesUoP(values);
    if (toGrosz(result.fullSalaryBrutto) !== toGrosz(String(row.gross_salary_calculated)) ||
      toGrosz(result.netto) !== toGrosz(String(row.net_salary_calculated))) return null;
    return result;
  } catch {
    // A historical/invalid configuration must not be reinterpreted by statistics.
    return null;
  }
}

function mapSalary(row: RawSalary): StatisticsSalary {
  if (row.gross_salary_calculated == null || row.net_salary_calculated == null) {
    throw new Error(`Saved salary ${row.id} is missing calculated gross/net`);
  }
  const gross = numberOr(row.gross_salary_calculated), net = numberOr(row.net_salary_calculated);
  toGrosz(String(row.gross_salary_calculated)); toGrosz(String(row.net_salary_calculated));
  const uop = first(row.salary_uop_inputs), mandate = first(row.salary_mandate_inputs), uod = first(row.salary_uod_inputs);
  const inputs = row.contract_type === 'uop' ? uop : row.contract_type === 'mandate' ? mandate : uod;
  // Older/incomplete records still contribute their saved gross/net totals.
  // Missing inputs only make component replay unavailable for that record.
  const savedInputs = inputs ?? {};
  const bonusSnapshots = (row.salary_bonuses ?? []).map(mapBonus);
  const override = first(row.salary_overrides);
  const result = inputs ? replaySavedSalary(row, inputs, bonusSnapshots, settings(first(row.salary_calculation_settings)?.settings)) : null;
  return {
    id: row.id, workRelationId: row.work_relation_id, year: row.year, month: row.month,
    contractType: row.contract_type, paymentMode: row.payment_mode,
    grossSalaryCalculated: gross, netSalaryCalculated: net,
    grossSalaryOverride: optionalMoney(override?.gross_salary_override),
    netSalaryOverride: optionalMoney(override?.net_salary_override),
    employmentStartDate: row.employment_start_date ?? '', employmentEndDate: row.employment_end_date ?? '',
    l4: normalizeL4Ranges(dateRanges(savedInputs.l4)), leave: dateRanges(uop?.leave),
    holidays: dateRanges(savedInputs.holidays),
    dailyOvertime: numberOr(uop?.daily_overtime), weekendHolidayOvertime: numberOr(uop?.weekend_holiday_overtime),
    nightOvertime: numberOr(uop?.night_overtime), turnOfDayHours: numberOr(uop?.turn_of_day_hours),
    bonuses: bonusSnapshots, verifiedCalculation: result,
  };
}

export async function getStatisticsSalaries(period: StatisticsPeriod, workRelationIds: string[]): Promise<StatisticsSalary[]> {
  if (!workRelationIds.length) return [];
  const [startYear, startMonth] = period.start.split('-').map(Number);
  const [endYear, endMonth] = period.end.split('-').map(Number);
  const pageSize = 200;
  const result: StatisticsSalary[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from('salary_records').select(selectSalary)
      .in('work_relation_id', workRelationIds)
      .or(`year.gt.${startYear},and(year.eq.${startYear},month.gte.${startMonth})`)
      .or(`year.lt.${endYear},and(year.eq.${endYear},month.lte.${endMonth})`)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as RawSalary[];
    result.push(...rows.map(mapSalary));
    if (rows.length < pageSize) break;
  }
  return result;
}

export async function getAnnualStatisticsFacts(year: number, workRelationIds: string[]): Promise<AnnualFactRecord[]> {
  // Empty selection means no data, never all relations.
  if (workRelationIds.length === 0) return [];
  const pageSize = 400;
  const result: AnnualFactRecord[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from('salary_records').select(`
      id, work_relation_id, year, month,
      taxable_income_calculated, pit0_revenue_calculated, pension_disability_base_calculated
    `).eq('year', year).in('work_relation_id', workRelationIds).order('id', { ascending: true }).range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    result.push(...rows.map(row => ({
      id: row.id, workRelationId: row.work_relation_id, year: row.year, month: row.month,
      taxableIncome: row.taxable_income_calculated,
      pit0Revenue: row.pit0_revenue_calculated,
      pensionDisabilityBase: row.pension_disability_base_calculated,
    })));
    if (rows.length < pageSize) break;
  }
  return result;
}
