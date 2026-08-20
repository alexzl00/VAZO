import { supabase } from "../lib/supabase";

export async function createUopSalary(values: any) {
  const { data, error } = await supabase.rpc('insert_uop_salary', {
    p_year: values.year,
    p_month: values.month,
    p_contract_type: 'uop',
    p_payment_mode: values.workRateType.split("_")[1],

    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_working_hours: values.workingHours,

    p_rate: values.rate,
    p_addition_after_tax: values.additionAfterTax,
    p_deduction_after_tax: values.deductionAfterTax,
    p_tax_regime: values.taxRegime,
    p_pit2: values.pit2,

    p_attendance_bonus: values.attendanceBonus,
    p_discretionary_bonus: values.discretionaryBonus,
    p_other_bonus: values.otherBonus,

    p_daily_overtime: values.dailyOvertime,
    p_weekend_overtime: values.weekendHolidayOvertime,
    p_night_overtime: values.nightOvertime,
    p_night_hours: values.nightHours,
    p_turn_of_day_hours: values.turnOfDayHours,

    p_holidays: values.holidays,

    p_l4: values.l4,
    p_l4_base: values.l4Base,

    p_leave: values.leave,
    p_leave_base: values.leaveBase
  });

  if (error) throw error;

  return data;
}

export async function updateUopSalary(id: string, values: any) {
  const { data, error } = await supabase.rpc('update_uop_salary', {
    p_id: id,

    p_year: values.year,
    p_month: values.month,
    p_payment_mode: values.workRateType.split("_")[1],

    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_working_hours: values.workingHours,

    p_rate: values.rate,
    p_addition_after_tax: values.additionAfterTax,
    p_deduction_after_tax: values.deductionAfterTax,
    p_tax_regime: values.taxRegime,
    p_pit2: values.pit2,

    p_attendance_bonus: values.attendanceBonus,
    p_discretionary_bonus: values.discretionaryBonus,
    p_other_bonus: values.otherBonus,

    p_daily_overtime: values.dailyOvertime,
    p_weekend_overtime: values.weekendHolidayOvertime,
    p_night_overtime: values.nightOvertime,
    p_night_hours: values.nightHours,
    p_turn_of_day_hours: values.turnOfDayHours,

    p_holidays: values.holidays,

    p_l4: values.l4,
    p_l4_base: values.l4Base,

    p_leave: values.leave,
    p_leave_base: values.leaveBase
  });

  if (error) throw error;

  return data;
}