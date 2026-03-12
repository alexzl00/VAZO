import { supabase } from "./supabaseClient";

export async function createMandateSalary(values: any) {
  const { data, error } = await supabase.rpc('insert_mandate_salary', {
    p_year: values.year,
    p_month: values.month,
    p_contract_type: 'mandate',
    p_payment_mode: 'hourly',

    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_working_hours: values.workingHours,

    p_rate: values.rate,
    p_kup: values.kup,
    p_is_student: values.isStudent,
    p_is_under26: values.isUnder26,
    p_pit2: values.pit2,

    p_holidays: values.holidays
  });

  if (error) throw error;

  return data; // salary_id
}

export async function updateMandateSalary(id: string, values: any) {
  const { data, error } = await supabase.rpc('update_mandate_salary', {
    p_id: id,

    p_year: values.year,
    p_month: values.month,
    p_contract_type: 'mandate',
    p_payment_mode: 'hourly',

    p_gross_salary: values.brutto,
    p_net_salary: values.netto,
    p_working_hours: values.workingHours,

    p_rate: values.rate,
    p_kup: values.kup,
    p_is_student: values.isStudent,
    p_is_under26: values.isUnder26,
    p_pit2: values.pit2,

    p_holidays: values.holidays
  });

  if (error) throw error;

  return data; // salary_id
}