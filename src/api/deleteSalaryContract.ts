import { supabase } from "../lib/supabase";

export const deleteSalaryContract = async (salaryId: string) => {
  const { error } = await supabase
    .from('salary_records')
    .delete()
    .eq('id', salaryId);

  return error;
}