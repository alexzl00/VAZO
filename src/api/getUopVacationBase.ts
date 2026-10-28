import { supabase } from '../lib/supabase';
import { getUopSicknessBaseHistory } from './getUopSicknessBase';
import type { UopVacationBaseHistory } from '../types/uopVacationBase';
import type { VacationTreatment } from '../types/salaryCalculator';

/** Reuse the existing L4 historical RPC. Its bonus JSON does not expose
 * vacation_treatment, so read it from existing salary snapshot rows (not
 * mutable bonus definitions). No new RPC, schema column, or migration.
 */
export const getUopVacationBaseHistory = async (
  workRelationId: string, year: number, month: number,
): Promise<UopVacationBaseHistory> => {
  const history = await getUopSicknessBaseHistory(workRelationId, year, month);
  const salaryIds = history.months.map(entry => entry.salaryId);
  const policyById = new Map<string, VacationTreatment | null>();
  if (salaryIds.length) {
    const { data, error } = await supabase
      .from('salary_bonuses')
      .select('id, salary_id, vacation_treatment')
      .in('salary_id', salaryIds);
    if (error) throw error;
    for (const item of data ?? []) {
      const policy = item.vacation_treatment;
      policyById.set(String(item.id),
        policy === 'paidInFull' || policy === 'variableBase' || policy === 'excluded'
          ? policy : null);
    }
  }
  return {
    ...history,
    months: history.months.map(entry => ({
      ...entry,
      bonuses: entry.bonuses.map(bonus => ({
        ...bonus,
        vacationTreatment: policyById.get(bonus.id) ?? null,
      })),
    })),
  };
};
