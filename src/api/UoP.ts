import { supabase } from "../lib/supabase";

const getUopCalculationSettings = (values: any) => ({
  hourlyRateCalculationMode:
    values.hourlyRateCalculationMode ?? "roundedTo2"
});

export async function createUopSalary(values: any) {
  if (!values.workRelationId) {
    throw new Error("Work relation is required to save a UoP salary.");
  }

  const { data, error } = await supabase.rpc("insert_uop_salary", {
    p_work_relation_id: values.workRelationId,
    p_year: values.year,
    p_month: values.month,
    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_rate: values.rate,
    p_working_hours: values.workingHours,

    p_is_under_26: values.isUnder26 ?? false,
    p_pit0_relief: values.pit0Relief ?? "none",
    p_previous_pit0_revenue: values.previousPit0Revenue ?? 0,

    p_pit2_monthly_reduction: values.pit2MonthlyReduction ?? 0,
    p_previous_taxable_income: values.previousTaxableIncome ?? 0,
    p_do_not_withhold_pit_advance:
      values.doNotWithholdPitAdvance ?? false,

    p_uop_kup: values.uopKup ?? 250,
    p_has_multiple_employment_relationships:
      values.hasMultipleEmploymentRelationships ?? false,
    p_previous_uop_kup_used: values.previousUopKupUsed ?? 0,

    p_previous_pension_disability_base:
      values.previousPensionDisabilityBase ?? 0,

    p_ppk_enabled: values.ppkEnabled ?? false,
    p_ppk_employee_rate: values.ppkEmployeeRate ?? 2,
    p_ppk_employer_rate: values.ppkEmployerRate ?? 1.5,
    p_ppk_employer_taxable_contribution:
      values.ppkEmployerTaxableContribution ?? null,

    p_holidays: values.holidays ?? [],

    p_daily_overtime: values.dailyOvertime ?? 0,
    p_weekend_holiday_overtime: values.weekendHolidayOvertime ?? 0,
    p_night_overtime: values.nightOvertime ?? 0,
    p_night_hours: values.nightHours ?? 0,
    p_turn_of_day_hours: values.turnOfDayHours ?? 0,
    p_overtime_limit: values.overtimeLimit ?? 0,

    p_l4: values.l4 ?? [],
    p_l4_base: values.l4Base ?? 0,
    p_uop_employer_sick_pay_limit:
      values.uopEmployerSickPayLimit ?? 33,
    p_previous_employer_sick_pay_days:
      values.previousEmployerSickPayDays ?? 0,

    p_leave: values.leave ?? [],
    p_leave_base: values.leaveBase ?? 0,

    p_addition_after_tax: values.additionAfterTax ?? 0,
    p_deduction_after_tax: values.deductionAfterTax ?? 0,

    p_bonuses: values.bonuses ?? [],
    p_calculation_settings: getUopCalculationSettings(values)
  });

  if (error) throw error;

  return data;
}

export async function updateUopSalary(id: string, values: any) {
  const { data, error } = await supabase.rpc("update_uop_salary", {
    p_id: id,
    p_year: values.year,
    p_month: values.month,
    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_rate: values.rate,
    p_working_hours: values.workingHours,

    p_is_under_26: values.isUnder26 ?? false,
    p_pit0_relief: values.pit0Relief ?? "none",
    p_previous_pit0_revenue: values.previousPit0Revenue ?? 0,

    p_pit2_monthly_reduction: values.pit2MonthlyReduction ?? 0,
    p_previous_taxable_income: values.previousTaxableIncome ?? 0,
    p_do_not_withhold_pit_advance:
      values.doNotWithholdPitAdvance ?? false,

    p_uop_kup: values.uopKup ?? 250,
    p_has_multiple_employment_relationships:
      values.hasMultipleEmploymentRelationships ?? false,
    p_previous_uop_kup_used: values.previousUopKupUsed ?? 0,

    p_previous_pension_disability_base:
      values.previousPensionDisabilityBase ?? 0,

    p_ppk_enabled: values.ppkEnabled ?? false,
    p_ppk_employee_rate: values.ppkEmployeeRate ?? 2,
    p_ppk_employer_rate: values.ppkEmployerRate ?? 1.5,
    p_ppk_employer_taxable_contribution:
      values.ppkEmployerTaxableContribution ?? null,

    p_holidays: values.holidays ?? [],

    p_daily_overtime: values.dailyOvertime ?? 0,
    p_weekend_holiday_overtime: values.weekendHolidayOvertime ?? 0,
    p_night_overtime: values.nightOvertime ?? 0,
    p_night_hours: values.nightHours ?? 0,
    p_turn_of_day_hours: values.turnOfDayHours ?? 0,
    p_overtime_limit: values.overtimeLimit ?? 0,

    p_l4: values.l4 ?? [],
    p_l4_base: values.l4Base ?? 0,
    p_uop_employer_sick_pay_limit:
      values.uopEmployerSickPayLimit ?? 33,
    p_previous_employer_sick_pay_days:
      values.previousEmployerSickPayDays ?? 0,

    p_leave: values.leave ?? [],
    p_leave_base: values.leaveBase ?? 0,

    p_addition_after_tax: values.additionAfterTax ?? 0,
    p_deduction_after_tax: values.deductionAfterTax ?? 0,

    p_bonuses: values.bonuses ?? [],
    p_calculation_settings: getUopCalculationSettings(values)
  });

  if (error) throw error;

  return data;
}
