import { supabase } from "./supabaseClient";

export const deleteSalaryContract = async (salaryId: string) => {
  const { error } = await supabase
    .from('salary_records')
    .delete()
    .eq('id', salaryId);

  return error;
}