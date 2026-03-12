import { supabase } from "./supabaseClient";

export async function createUopSalary(values: any) {
  const { data, error } = await supabase.rpc('insert_uop_salary', {
    p_year: values.year,
    p_month: values.month,
    p_contract_type: 'uop',
    p_payment_mode: values.workRateType,

    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_working_hours: values.workingHours,

    p_rate: values.rate,
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
    p_leave: values.leave
  });

  if (error) throw error;

  return data;
}

export async function updateUopSalary(id: string, values: any) {
  const { data, error } = await supabase.rpc('update_uop_salary', {
    p_id: id,

    p_year: values.year,
    p_month: values.month,
    p_contract_type: 'uop',
    p_payment_mode: values.workRateType,

    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_working_hours: values.workingHours,

    p_rate: values.rate,
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
    p_leave: values.leave
  });

  if (error) throw error;

  return data;
}