import { supabase } from "./supabaseClient";

export type ContractType = 'uop' | 'mandate' | 'uod';
export type PaymentMode = 'hourly' | 'month' | 'fixed';

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

  isOverridden: boolean;
  grossSalaryOverride: number | null;
  netSalaryOverride: number | null;

  overrideReason: string | null;
  overrideCreatedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export async function getSalaries(
  filters: SalaryFilters,
  page = 1,
  pageSize = 10
) {
  let query = supabase
    .from('salary_records')
    .select(`
      *,
      salary_overrides (
        net_salary_override,
        gross_salary_override,
        reason,
        created_at
      )
    `);

  // --- Filters ---
  if (filters.id) {
    query = query.eq('id', filters.id);
  }

  if (filters.year) {
    query = query.eq('year', filters.year);
  }

  if (filters.monthFrom) {
    query = query.gte('month', filters.monthFrom);
  }

  if (filters.monthTo) {
    query = query.lte('month', filters.monthTo);
  }

  if (filters.contractType) {
    query = query.eq('contract_type', filters.contractType);
  }

  // --- Pagination ---
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  // --- Execute ---
  const { data, error } = await query;

  if (error) {
    console.error(error);
    return { res: [], count: 0 };
  }

  // --- Map response ---
  const res: SalaryRecord[] = (data ?? []).map((salary: any) => {
    const override = salary.salary_overrides;

    return {
      id: salary.id,
      year: salary.year,
      month: salary.month,
      contractType: salary.contract_type,
      paymentMode: salary.payment_mode,

      grossSalaryCalculated: salary.gross_salary_calculated,
      netSalaryCalculated: salary.net_salary_calculated,

      isOverridden: salary.is_overridden,
      grossSalaryOverride: override?.gross_salary_override ?? null,
      netSalaryOverride: override?.net_salary_override ?? null,
      
      overrideReason: override?.reason ?? null,
      overrideCreatedAt: override?.created_at ?? null,

      createdAt: salary.created_at,
      updatedAt: salary.updated_at
    };
  });

  return {
    res,
    count: res.length
  };
}
