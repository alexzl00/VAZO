import { supabase } from "../lib/supabase";

export type ContractType = 'uop' | 'mandate' | 'uod';

export interface SalaryContract {
  salary_record: any;
  inputs: any;

  override: {
    netSalaryOverride: number | null;
    grossSalaryOverride: number | null;
    reason: string | null;
    createdAt: string | null;
  } | null;
}

export async function getSalaryContract(id: string): Promise<SalaryContract | null> {
  // --- 1. Get salary record + override ---
  const { data: sr, error: srError } = await supabase
    .from('salary_records')
    .select(`
      *,
      salary_overrides (
        net_salary_override,
        gross_salary_override,
        reason,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (srError) {
    console.error(srError);
    return null;
  }

  const override = sr.salary_overrides ?? null;

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

  if (sr.contract_type === "uod") {
    const { data: uod, error } = await supabase
      .from("salary_uod_inputs")
      .select(`
        rate,
        kup,
        pit2,
        addition_after_tax,
        deduction_after_tax,
        discretionary_bonus
      `)
      .eq("salary_id", sr.id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    inputs = uod;
  }

  return {
    salary_record: sr,
    inputs,

    override: override
      ? {
          netSalaryOverride: override.net_salary_override,
          grossSalaryOverride: override.gross_salary_override,
          reason: override.reason ?? null,
          createdAt: override.created_at ?? null
        }
      : null
  };
}
