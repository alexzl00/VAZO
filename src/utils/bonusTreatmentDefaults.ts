import type {
  BonusFrequency,
  BonusPaymentType,
  SickLeaveTreatment,
  VacationTreatment,
} from '../types/salaryCalculator';

/** Application assumptions for unconfigured bonuses, not employer-specific rules.
 * Keep NULL in salary snapshots and saved definitions; resolve only on use.
 */
export const BONUS_DEFAULT_CONFIG = {
  sickLeaveTreatment: 'notPaid',
  vacationTreatment: 'variableBase',
} as const satisfies {
  sickLeaveTreatment: SickLeaveTreatment;
  vacationTreatment: VacationTreatment;
};

type BonusTreatmentInput = {
  sickLeaveTreatment?: SickLeaveTreatment | null;
  vacationTreatment?: VacationTreatment | null;
  frequency?: BonusFrequency | null;
  paymentType?: BonusPaymentType | null;
};

type ResolvedTreatment<T extends string> = {
  value: T;
  source: 'explicit' | 'default';
};

export type ResolvedBonusTreatments = {
  sickLeaveTreatment: ResolvedTreatment<SickLeaveTreatment>;
  vacationTreatment: ResolvedTreatment<VacationTreatment>;
};

const defaultVacationTreatment = (bonus: BonusTreatmentInput): VacationTreatment =>
  bonus.frequency === 'monthly' && bonus.paymentType !== 'nonCash'
    ? BONUS_DEFAULT_CONFIG.vacationTreatment
    : 'excluded';

/** One source of truth for the effective calculation policy and its origin.
 * A deliberate selection always wins. Only null/undefined use a fallback.
 */
export const resolveBonusTreatments = (
  bonus: BonusTreatmentInput,
): ResolvedBonusTreatments => ({
  sickLeaveTreatment: {
    value: bonus.sickLeaveTreatment ?? BONUS_DEFAULT_CONFIG.sickLeaveTreatment,
    source: bonus.sickLeaveTreatment == null ? 'default' : 'explicit',
  },
  vacationTreatment: {
    value: bonus.vacationTreatment ?? defaultVacationTreatment(bonus),
    source: bonus.vacationTreatment == null ? 'default' : 'explicit',
  },
});
