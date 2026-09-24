import { useNavigate } from "react-router-dom";

// third parties
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useSnackbar } from "notistack";
import { useIntl } from "react-intl";

dayjs.extend(isSameOrBefore);

// project imports
import SalaryForm from "../../sections/salary-calculator-form/SalaryCalculatorForm";

// utils
import { getNominalWorkingHoursInMonth } from "../../utils/workingTimeHelper";
import {
  calculateTaxesContractOfMandate,
  calculateTaxesUoD,
  calculateTaxesUoP
} from "../../utils/workTypeSalaryCalc";

// supabase api
import { createUopSalary } from "../../api/UoP";
import { createMandateSalary } from "../../api/CoM";
import { createUoDSalary } from "../../api/UoD";
import { overrideSalaryCalculations } from "../../api/overrideSalaryCalculations";

// types
import type { SalaryCalculatorValues } from "../../types/salaryCalculator";

const now = new Date();

export const initialSalaryFormValues: SalaryCalculatorValues = {
  // PIT / KUP
  pit2MonthlyReduction: 0,
  uopKup: 250,
  hasMultipleEmploymentRelationships: false,
  kup: 20,
  pit0Relief: "none",
  isStudent: false,
  isUnder26: false,

  previousTaxableIncome: 0,
  previousPit0Revenue: 0,
  previousPensionDisabilityBase: 0,
  previous50KupUsed: 0,
  previousUopKupUsed: 0,

  doNotWithholdPitAdvance: false,

  // Sickness eligibility / UoP sickness
  sicknessBenefitEligible: true,
  uopEmployerSickPayLimit: 33,
  previousEmployerSickPayDays: 0,

  // UZ / UoD insurance status
  mandateVoluntarySicknessInsurance: false,
  mandateHasOtherUopAtLeastMinimumBase: false,
  mandateOtherSocialBaseBeforeThisContract: 0,
  isOwnEmployerContract: false,
  performedForOwnEmployer: false,
  smallContractLumpSumEligible: false,

  // PPK
  ppkEnabled: false,
  ppkEmployeeRate: 2,
  ppkEmployerRate: 1.5,

  deductionAfterTax: 0,
  additionAfterTax: 0,

  // Work relation / employment period
  workRelationId: null,
  employmentStartDate: null,
  employmentEndDate: null,

  // Calendar
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  workingHours: getNominalWorkingHoursInMonth(
    now.getFullYear(),
    now.getMonth()
  ),

  // Rate and bonuses
  workRateType: "uop_monthly",
  rate: 0,
  hourlyRateCalculationMode: "roundedTo2",
  bonuses: [],
  functionalAllowance: 0,
  functionalAllowanceRetainedDuringSickness: false,

  holidays: [],

  // Overtime / night work
  dailyOvertime: 0,
  weekendHolidayOvertime: 0,
  nightOvertime: 0,
  nightHours: 0,
  turnOfDayHours: 0,
  overtimeLimit: 30,

  // L4
  l4: [],
  l4Base: 0,

  // Leave
  vacationBaseMonths: 3,
  leave: [],
  leaveBase: 0,

  // Edit / override fields
  isOverride: false,
  netSalaryOverride: null,
  grossSalaryOverride: null,
  reason: null
};

export default function CreateSalaryPage() {
  const intl = useIntl();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const navigateToSalaries = () => {
    navigate({
      pathname: "/salaries"
    });
  };

  const handleOverride = async (
    id: string,
    values: SalaryCalculatorValues
  ) => {
    const hasOverride =
      values.netSalaryOverride !== null ||
      values.grossSalaryOverride !== null;

    if (!hasOverride) return;

    await overrideSalaryCalculations(id, {
      netSalaryOverride: values.netSalaryOverride,
      grossSalaryOverride: values.grossSalaryOverride,
      reason: values.reason
    });
  };

  const handleCreate = async (values: SalaryCalculatorValues) => {
    try {
      if (!values.workRelationId) {
        throw new Error("Work relation is required to save salary.");
      }

      let salaryId: string | null = null;

      if (values.workRateType === "mandate_hourly") {
        const calculated = calculateTaxesContractOfMandate(values);

        salaryId = await createMandateSalary({
          ...values,
          brutto: calculated.brutto,
          netto: calculated.netto
        });
      } else if (
        values.workRateType === "uop_monthly" ||
        values.workRateType === "uop_hourly"
      ) {
        const calculated = calculateTaxesUoP(values);

        salaryId = await createUopSalary({
          ...values,
          brutto: calculated.brutto,
          netto: calculated.netto
        });
      } else if (values.workRateType === "uod_fixed") {
        const calculated = calculateTaxesUoD(values);

        salaryId = await createUoDSalary({
          ...values,
          brutto: calculated.brutto,
          netto: calculated.netto
        });
      }

      if (!salaryId) {
        throw new Error("Failed to create salary.");
      }

      await handleOverride(salaryId, values);

      enqueueSnackbar(
        intl.formatMessage({ id: "salary-saved" }),
        { variant: "success" }
      );

      navigateToSalaries();
    } catch (error) {
      console.error(error);

      enqueueSnackbar(
        intl.formatMessage({ id: "error" }),
        { variant: "error" }
      );
    }
  };

  return (
    <SalaryForm
      initialValues={initialSalaryFormValues}
      onSubmit={handleCreate}
      type="create"
    />
  );
}
