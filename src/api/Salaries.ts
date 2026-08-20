import { supabase } from "../lib/supabase";

export type ContractType = "uop" | "mandate" | "uod";
export type PaymentMode = "hourly" | "month" | "fixed";

export type SalaryFilters = {
  id: string | "";
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  contractType: ContractType | "";
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

export type GetSalariesResult = {
  res: SalaryRecord[];
  hasMore: boolean;
};

export async function getSalaries(
  filters: SalaryFilters,
  page = 1,
  pageSize = 10
): Promise<GetSalariesResult> {
  const safePage = Math.max(page, 1);
  const safePageSize = Math.max(pageSize, 1);

  const from = (safePage - 1) * safePageSize;

  // Fetch one extra row to detect if there is another page.
  const to = from + safePageSize;

  let query = supabase
    .from("salary_records")
    .select(`
      *,
      salary_overrides (
        net_salary_override,
        gross_salary_override,
        reason,
        created_at
      )
    `);

  if (filters.id) {
    query = query.eq("id", filters.id);
  }

  query = query.or(
    `year.gt.${filters.startYear},and(year.eq.${filters.startYear},month.gte.${filters.startMonth})`
  );

  query = query.or(
    `year.lt.${filters.endYear},and(year.eq.${filters.endYear},month.lte.${filters.endMonth})`
  );

  if (filters.contractType) {
    query = query.eq("contract_type", filters.contractType);
  }

  query = query
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error(error);

    return {
      res: [],
      hasMore: false
    };
  }

  const rows = data ?? [];

  const hasMore = rows.length > safePageSize;

  const visibleRows = hasMore ? rows.slice(0, safePageSize) : rows;

  const res: SalaryRecord[] = visibleRows.map((salary: any) => {
    const override = Array.isArray(salary.salary_overrides)
      ? salary.salary_overrides[0]
      : salary.salary_overrides;

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
    hasMore
  };
}