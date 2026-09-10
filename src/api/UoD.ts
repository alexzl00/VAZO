import { supabase } from "../lib/supabase";

export async function createUoDSalary(values: any) {
  if (!values.workRelationId) {
    throw new Error("Work relation is required to save a UoD salary.");
  }

  const { data, error } = await supabase.rpc("insert_uod_salary", {
    p_work_relation_id: values.workRelationId,
    p_year: values.year,
    p_month: values.month,
    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_rate: values.rate,

    p_kup: values.kup ?? 20,
    p_pit2_monthly_reduction: values.pit2MonthlyReduction ?? 0,
    p_previous_taxable_income: values.previousTaxableIncome ?? 0,
    p_previous_copyright_kup_used: values.previous50KupUsed ?? 0,
    p_do_not_withhold_pit_advance:
      values.doNotWithholdPitAdvance ?? false,

    p_is_own_employer_contract:
      values.isOwnEmployerContract ?? false,
    p_performed_for_own_employer:
      values.performedForOwnEmployer ?? false,
    p_previous_pension_disability_base:
      values.previousPensionDisabilityBase ?? 0,
    p_small_contract_lump_sum_eligible:
      values.smallContractLumpSumEligible ?? false,

    p_addition_after_tax: values.additionAfterTax ?? 0,
    p_deduction_after_tax: values.deductionAfterTax ?? 0,

    p_bonuses: values.bonuses ?? [],
    p_calculation_settings: {}
  });

  if (error) throw error;

  return data;
}

export async function updateUoDSalary(id: string, values: any) {
  const { data, error } = await supabase.rpc("update_uod_salary", {
    p_id: id,
    p_year: values.year,
    p_month: values.month,
    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_rate: values.rate,

    p_kup: values.kup ?? 20,
    p_pit2_monthly_reduction: values.pit2MonthlyReduction ?? 0,
    p_previous_taxable_income: values.previousTaxableIncome ?? 0,
    p_previous_copyright_kup_used: values.previous50KupUsed ?? 0,
    p_do_not_withhold_pit_advance:
      values.doNotWithholdPitAdvance ?? false,

    p_is_own_employer_contract:
      values.isOwnEmployerContract ?? false,
    p_performed_for_own_employer:
      values.performedForOwnEmployer ?? false,
    p_previous_pension_disability_base:
      values.previousPensionDisabilityBase ?? 0,
    p_small_contract_lump_sum_eligible:
      values.smallContractLumpSumEligible ?? false,

    p_addition_after_tax: values.additionAfterTax ?? 0,
    p_deduction_after_tax: values.deductionAfterTax ?? 0,

    p_bonuses: values.bonuses ?? [],
    p_calculation_settings: {}
  });

  if (error) throw error;

  return data;
}