import { supabase } from "../lib/supabase";

export async function createMandateSalary(values: any) {
  if (!values.workRelationId) {
    throw new Error("Work relation is required to save a Mandate salary.");
  }

  const { data, error } = await supabase.rpc("insert_mandate_salary", {
    p_work_relation_id: values.workRelationId,
    p_year: values.year,
    p_month: values.month,
    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_rate: values.rate,
    p_working_hours: values.workingHours,

    p_is_student: values.isStudent ?? false,
    p_is_under_26: values.isUnder26 ?? false,

    p_pit0_relief: values.pit0Relief ?? "none",
    p_previous_pit0_revenue: values.previousPit0Revenue ?? 0,

    p_kup: values.kup ?? 20,
    p_pit2_monthly_reduction: values.pit2MonthlyReduction ?? 0,
    p_previous_taxable_income: values.previousTaxableIncome ?? 0,
    p_previous_copyright_kup_used: values.previous50KupUsed ?? 0,
    p_do_not_withhold_pit_advance:
      values.doNotWithholdPitAdvance ?? false,

    p_previous_pension_disability_base:
      values.previousPensionDisabilityBase ?? 0,

    p_mandate_voluntary_sickness_insurance:
      values.mandateVoluntarySicknessInsurance ?? false,
    p_mandate_sickness_benefit_eligible:
      values.mandateSicknessBenefitEligible ?? false,
    p_mandate_has_other_uop_at_least_minimum_base:
      values.mandateHasOtherUopAtLeastMinimumBase ?? false,
    p_mandate_other_social_base_before_this_contract:
      values.mandateOtherSocialBaseBeforeThisContract ?? 0,

    p_is_own_employer_contract:
      values.isOwnEmployerContract ?? false,
    p_performed_for_own_employer:
      values.performedForOwnEmployer ?? false,
    p_small_contract_lump_sum_eligible:
      values.smallContractLumpSumEligible ?? false,

    p_ppk_enabled: values.ppkEnabled ?? false,
    p_ppk_employee_rate: values.ppkEmployeeRate ?? 2,
    p_ppk_employer_rate: values.ppkEmployerRate ?? 1.5,
    p_ppk_employer_taxable_contribution:
      values.ppkEmployerTaxableContribution ?? null,

    p_holidays: values.holidays ?? [],
    p_l4: values.l4 ?? [],
    p_l4_base: values.l4Base ?? 0,

    p_addition_after_tax: values.additionAfterTax ?? 0,
    p_deduction_after_tax: values.deductionAfterTax ?? 0,

    p_bonuses: values.bonuses ?? [],
    p_calculation_settings: {}
  });

  if (error) throw error;

  return data;
}

export async function updateMandateSalary(id: string, values: any) {
  const { data, error } = await supabase.rpc("update_mandate_salary", {
    p_id: id,
    p_year: values.year,
    p_month: values.month,
    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_rate: values.rate,
    p_working_hours: values.workingHours,

    p_is_student: values.isStudent ?? false,
    p_is_under_26: values.isUnder26 ?? false,

    p_pit0_relief: values.pit0Relief ?? "none",
    p_previous_pit0_revenue: values.previousPit0Revenue ?? 0,

    p_kup: values.kup ?? 20,
    p_pit2_monthly_reduction: values.pit2MonthlyReduction ?? 0,
    p_previous_taxable_income: values.previousTaxableIncome ?? 0,
    p_previous_copyright_kup_used: values.previous50KupUsed ?? 0,
    p_do_not_withhold_pit_advance:
      values.doNotWithholdPitAdvance ?? false,

    p_previous_pension_disability_base:
      values.previousPensionDisabilityBase ?? 0,

    p_mandate_voluntary_sickness_insurance:
      values.mandateVoluntarySicknessInsurance ?? false,
    p_mandate_sickness_benefit_eligible:
      values.mandateSicknessBenefitEligible ?? false,
    p_mandate_has_other_uop_at_least_minimum_base:
      values.mandateHasOtherUopAtLeastMinimumBase ?? false,
    p_mandate_other_social_base_before_this_contract:
      values.mandateOtherSocialBaseBeforeThisContract ?? 0,

    p_is_own_employer_contract:
      values.isOwnEmployerContract ?? false,
    p_performed_for_own_employer:
      values.performedForOwnEmployer ?? false,
    p_small_contract_lump_sum_eligible:
      values.smallContractLumpSumEligible ?? false,

    p_ppk_enabled: values.ppkEnabled ?? false,
    p_ppk_employee_rate: values.ppkEmployeeRate ?? 2,
    p_ppk_employer_rate: values.ppkEmployerRate ?? 1.5,
    p_ppk_employer_taxable_contribution:
      values.ppkEmployerTaxableContribution ?? null,

    p_holidays: values.holidays ?? [],
    p_l4: values.l4 ?? [],
    p_l4_base: values.l4Base ?? 0,

    p_addition_after_tax: values.additionAfterTax ?? 0,
    p_deduction_after_tax: values.deductionAfterTax ?? 0,

    p_bonuses: values.bonuses ?? [],
    p_calculation_settings: {}
  });

  if (error) throw error;

  return data;
}
