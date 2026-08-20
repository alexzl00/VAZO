import { supabase } from "../lib/supabase";

export async function createUoDSalary(values: any) {
  const { data, error } = await supabase.rpc('insert_uod_salary', {
    p_year: values.year,
    p_month: values.month,
    p_contract_type: 'uod',
    p_payment_mode: 'fixed',

    p_gross_salary: values.brutto,
    p_net_salary: values.netto,

    p_rate: values.rate,
    p_addition_after_tax: values.additionAfterTax,
    p_deduction_after_tax: values.deductionAfterTax,
    p_kup: values.kup,
    p_pit2: values.pit2,

    p_discretionary_bonus: values.discretionaryBonus,
  });

  if (error) throw error;

  return data; // salary_id
}

export async function updateUoDSalary(id: string, values: any) {
  const { data, error } = await supabase.rpc('update_uod_salary', {
    p_id: id,

    p_year: values.year,
    p_month: values.month,

    p_gross_salary: values.brutto,
    p_net_salary: values.netto,

    p_rate: values.rate,
    p_addition_after_tax: values.additionAfterTax,
    p_deduction_after_tax: values.deductionAfterTax,
    p_kup: values.kup,
    p_pit2: values.pit2,

    p_discretionary_bonus: values.discretionaryBonus,
  });

  if (error) throw error;

  return data; // salary_id
}