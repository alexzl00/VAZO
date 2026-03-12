import { supabase } from "./supabaseClient";

export async function getSalaryContract(id: string) {
  const { data, error } = await supabase.rpc('get_salary_contract', {
    p_salary_id: id
  });

  console.log(data)

  if (error) throw error;

  return data;
}