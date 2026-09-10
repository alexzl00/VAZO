import { supabase } from "../lib/supabase";
import type { SalaryBonus } from "../types/salaryCalculator";

export type SalaryOverride = {
  netSalaryOverride: number | null;
  grossSalaryOverride: number | null;
  reason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SalaryContract {
  salary_record: any;
  inputs: any;
  bonuses: SalaryBonus[];
  calculationSettings: Record<string, unknown>;

  override: SalaryOverride | null;
}

const mapBonus = (bonus: any): SalaryBonus => ({
  id: bonus.id,
  name: bonus.name,
  amount: Number(bonus.amount),
  frequency: bonus.frequency,
  paymentType: bonus.payment_type,
  amountType: bonus.amount_type ?? undefined,
  sickLeaveTreatment: bonus.sick_leave_treatment ?? undefined
});

export async function getSalaryContract(
  id: string
): Promise<SalaryContract | null> {
  const { data, error } = await supabase.rpc("get_salary_contract", {
    p_salary_id: id
  });

  if (error) {
    console.error(error);
    return null;
  }

  if (!data) {
    return null;
  }

  const result = data as any;
  const override = result.override ?? null;

  return {
    salary_record: result.salary,
    inputs: result.inputs,

    bonuses: Array.isArray(result.bonuses)
      ? result.bonuses.map(mapBonus)
      : [],

    calculationSettings:
      result.calculation_settings &&
      typeof result.calculation_settings === "object"
        ? result.calculation_settings
        : {},

    override: override
      ? {
          netSalaryOverride: override.net_salary_override ?? null,
          grossSalaryOverride: override.gross_salary_override ?? null,
          reason: override.reason ?? null,
          createdAt: override.created_at ?? null,
          updatedAt: override.updated_at ?? null
        }
      : null
  };
}
