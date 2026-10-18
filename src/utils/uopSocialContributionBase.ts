/**
 * Shared UoP social-insurance contribution-base calculations.
 *
 * The payroll engine supplies the full gross amount and its non-contributory
 * parts (e.g. sick pay); the L4 history engine reconstructs contributory
 * earnings directly. Both paths use the same final base calculation.
 *
 * This is NOT the sickness BENEFIT base: L4-specific adjustments, absence
 * supplementation and bonuses are handled by calculateUopSicknessBase.
 */

const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export type UopSocialInsuranceBaseInputs = {
  grossComponents: readonly number[];
  nonContributoryComponents?: readonly number[];
};

export const calculateUopSocialInsuranceBase = ({
  grossComponents,
  nonContributoryComponents = [],
}: UopSocialInsuranceBaseInputs): number => {
  const gross = grossComponents.reduce((sum, amount) => sum + amount, 0);
  const nonContributory = nonContributoryComponents.reduce(
    (sum, amount) => sum + amount,
    0,
  );

  return round2(Math.max(0, gross - nonContributory));
};

/**
 * Apply the annual pension/disability contribution ceiling.
 * Sickness contributions are calculated separately and are not capped here.
 */
export const calculateUopPensionDisabilityBase = ({
  socialInsuranceBase,
  previousPensionDisabilityBase,
  annualLimit,
}: {
  socialInsuranceBase: number;
  previousPensionDisabilityBase: number;
  annualLimit: number;
}): number =>
  round2(
    Math.min(
      socialInsuranceBase,
      Math.max(0, annualLimit - previousPensionDisabilityBase),
    ),
  );
