import { supabase } from "./supabaseClient";

export async function overrideSalaryCalculations(id: string, values: any) {
  const { data, error } = await supabase.rpc('override_salary_calculations', {
    p_id: id,
    p_net_salary_override: values.netSalaryOverride,
    p_gross_salary_override: values.grossSalaryOverride,
    p_reason: values.reason
  });

  if (error) throw error;

  return data;
}

export async function deleteSalaryOverride(id: string) {
  const { data, error } = await supabase.rpc('delete_salary_override', {
    p_salary_id: id
  });

  if (error) throw error;

  return data;
}