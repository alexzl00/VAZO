import { supabase } from "./supabaseClient";

export type ContractType = 'uop' | 'mandate';
export type PaymentMode = 'hourly' | 'month'

export type SalaryFilters = {
  id: string | '';
  year: number;
  monthFrom?: number;
  monthTo?: number;
  contractType: ContractType | '';
};

export interface SalaryRecord {
  id: string;
  year: number;
  month: number;
  contractType: ContractType;
  paymentMode: PaymentMode;
  grossSalaryCalculated: number;
  netSalaryCalculated: number;
  grossSalaryActual: number;
  netSalaryActual: number;
  isOverridden: boolean;
  overrideReason: string;
  createdAt: string;
  updatedAt: string;
}

export async function getSalaries(filters: SalaryFilters, page = 1, pageSize = 10) {
  let query = supabase.from('salary_records').select('*')

  // --- Dynamic Filters --
  if (filters.id) query = query.eq('id', filters.id)
    
  if (filters.year) query = query.gte('year', filters.year)
  if (filters.year) query = query.lte('year', filters.year)

  if (filters.monthFrom) query = query.gte('month', filters.monthFrom);
  if (filters.monthTo) query = query.lte('month', filters.monthTo);

  if (filters.contractType) query = query.eq('contract_type', filters.contractType)

  // --- Pagination ---
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error } = await query
  if (error) {
    console.error(error);
    return { res: [], count: 0 };
  }

  const res = data
    ? data.map((salary) => ({
        id: salary.id,
        year: salary.year,
        month: salary.month,
        contractType: salary.contract_type,
        paymentMode: salary.payment_mode,
        grossSalaryCalculated: salary.gross_salary_calculated,
        netSalaryCalculated: salary.net_salary_calculated,
        grossSalaryActual: salary.gross_salary_actual,
        netSalaryActual: salary.net_salary_actual,
        isOverridden: salary.is_overridden,
        overrideReason: salary.override_reason,
        createdAt: salary.created_at,
        updatedAt: salary.updated_at
      }))
    : [] as SalaryRecord[];

  return { res, count: res.length }
}