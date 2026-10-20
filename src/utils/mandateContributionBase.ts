/** UZ contribution liability shared by current payroll and historical L4. */
export type MandateContributionInputs = {
  regularRemunerationBrutto: number;
  isStudent?: boolean;
  isUnder26?: boolean;
  mandateVoluntarySicknessInsurance?: boolean;
  mandateHasOtherUopAtLeastMinimumBase?: boolean;
  mandateOtherSocialBaseBeforeThisContract?: number;
  isOwnEmployerContract?: boolean;
  performedForOwnEmployer?: boolean;
  minimumWage: number;
  voluntarySicknessMonthlyBaseLimit: number;
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const getMandateContributionContext = (inputs: MandateContributionInputs) => {
  const treatedAsEmployee = Boolean(
    inputs.isOwnEmployerContract || inputs.performedForOwnEmployer,
  );
  const studentExemption = Boolean(
    inputs.isStudent && inputs.isUnder26 && !treatedAsEmployee,
  );
  const otherTitleRemovesCompulsorySocial = Boolean(
    !treatedAsEmployee && !studentExemption
    && (inputs.mandateHasOtherUopAtLeastMinimumBase
      || (inputs.mandateOtherSocialBaseBeforeThisContract ?? 0) >= inputs.minimumWage),
  );
  const compulsorySocial = !studentExemption && !otherTitleRemovesCompulsorySocial;
  const healthCompulsory = !studentExemption;
  const voluntarySicknessInsuranceActive = Boolean(
    inputs.mandateVoluntarySicknessInsurance && compulsorySocial && !treatedAsEmployee,
  );
  const socialInsuranceBase = compulsorySocial
    ? round2(Math.max(0, inputs.regularRemunerationBrutto))
    : 0;
  const sicknessContributionBase = treatedAsEmployee
    ? socialInsuranceBase
    : voluntarySicknessInsuranceActive
      ? round2(Math.min(socialInsuranceBase, inputs.voluntarySicknessMonthlyBaseLimit))
      : 0;
  return {
    treatedAsEmployee,
    studentExemption,
    otherTitleRemovesCompulsorySocial,
    compulsorySocial,
    healthCompulsory,
    voluntarySicknessInsuranceActive,
    socialInsuranceBase,
    sicknessContributionBase,
    // Accident insurance follows compulsory social insurance for ordinary UZ.
    accidentContributionBase: compulsorySocial && !treatedAsEmployee
      ? socialInsuranceBase
      : 0,
  };
};
