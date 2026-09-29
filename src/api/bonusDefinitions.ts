import { supabase } from '../lib/supabase';

import type {
  SalaryBonusDefinition,
} from '../types/salaryCalculator';

export type SalaryBonusDefinitionStatus = 'active' | 'inactive';

const mapBonusDefinition = (row: any): SalaryBonusDefinition => ({
  id: row.id,
  workRelationId: row.work_relation_id,
  name: row.name,
  currentAmount: Number(row.current_amount),
  frequency: row.frequency,
  paymentType: row.payment_type,
  amountType: row.amount_type ?? undefined,
  sickLeaveTreatment: row.sick_leave_treatment ?? undefined,
  vacationTreatment: row.vacation_treatment ?? undefined,
  isActive: Boolean(row.is_active),
});

export async function getSalaryBonusDefinitions(
  workRelationId: string,
  status: SalaryBonusDefinitionStatus = 'active',
): Promise<SalaryBonusDefinition[]> {
  const { data, error } = await supabase
    .from('salary_bonus_definitions')
    .select(`
      id,
      work_relation_id,
      name,
      current_amount,
      frequency,
      payment_type,
      amount_type,
      sick_leave_treatment,
      vacation_treatment,
      is_active
    `)
    .eq('work_relation_id', workRelationId)
    .eq('is_active', status === 'active')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapBonusDefinition);
}

export async function setSalaryBonusDefinitionActive(
  definitionId: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('salary_bonus_definitions')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', definitionId);

  if (error) throw error;
}
