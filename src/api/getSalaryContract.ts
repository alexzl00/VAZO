import { supabase } from "./supabaseClient";

export type ContractType = 'uop' | 'mandate';

export interface SalaryContract {
  salary_record: any;
  inputs: any;
}

export async function getSalaryContract(id: string): Promise<SalaryContract | null> {
  // --- 1. Get salary record ---
  const { data: sr, error: srError } = await supabase
    .from('salary_records')
    .select('*')
    .eq('id', id)
    .single();

  if (srError) {
    console.error(srError);
    return null;
  }

  let inputs = null;

  // --- 2. Conditional fetch ---
  if (sr.contract_type === 'uop') {
    const { data: sui, error } = await supabase
      .from('salary_uop_inputs')
      .select(`
        rate,
        working_hours,
        tax_regime,
        pit2,
        attendance_bonus,
        discretionary_bonus,
        other_bonus,
        daily_overtime,
        weekend_overtime,
        night_overtime,
        night_hours,
        turn_of_day_hours,
        holidays,
        l4,
        leave,
        addition_after_tax,
        deduction_after_tax,
        l4_base,
        leave_base
      `)
      .eq('salary_id', sr.id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    inputs = sui;
  }

  if (sr.contract_type === 'mandate') {
    const { data: smi, error } = await supabase
      .from('salary_mandate_inputs')
      .select(`
        rate,
        working_hours,
        kup,
        is_student,
        is_under26,
        pit2,
        attendance_bonus,
        discretionary_bonus,
        other_bonus,
        addition_after_tax,
        deduction_after_tax,
        holidays
      `)
      .eq('salary_id', sr.id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    inputs = smi;
  }

  return {
    salary_record: sr,
    inputs
  };
}

// export async function getSalaryContract(id: string) {
//   const { data, error } = await supabase.rpc('get_salary_contract', {
//     p_salary_id: id
//   });

//   console.log(data)

//   if (error) throw error;

//   return data;
// }