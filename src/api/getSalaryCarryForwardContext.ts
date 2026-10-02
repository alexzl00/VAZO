import { supabase } from "../lib/supabase";

export type SalaryCarryForwardHistory = {
  complete: boolean;
  missingPeriods: string[];
  unknownFactPeriods: string[];
};

export type SalaryCarryForwardContext = {
  previousTaxableIncome: number;
  previousPit0Revenue: number;
  previousPensionDisabilityBase: number;
  previousUopKupUsed: number;
  history: SalaryCarryForwardHistory;
};

const toNumber = (value: unknown) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

export async function getSalaryCarryForwardContext(
  workRelationId: string,
  year: number,
  month: number,
): Promise<SalaryCarryForwardContext> {
  const { data, error } = await supabase.rpc(
    "get_salary_carry_forward_context",
    {
      p_work_relation_id: workRelationId,
      p_year: year,
      p_month: month,
    },
  );

  if (error) {
    throw error;
  }

  if (!data || typeof data !== "object") {
    throw new Error("Salary carry-forward context was not returned.");
  }

  const result = data as Record<string, any>;
  const history =
    result.history && typeof result.history === "object"
      ? result.history as Record<string, any>
      : {};

  return {
    previousTaxableIncome: toNumber(result.previousTaxableIncome),
    previousPit0Revenue: toNumber(result.previousPit0Revenue),
    previousPensionDisabilityBase: toNumber(
      result.previousPensionDisabilityBase,
    ),
    previousUopKupUsed: toNumber(result.previousUopKupUsed),
    history: {
      complete: history.complete === true,
      missingPeriods: toStringArray(history.missingPeriods),
      unknownFactPeriods: toStringArray(history.unknownFactPeriods),
    },
  };
}
