import { useNavigate } from "react-router-dom";

// third parties
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);

import { useSnackbar } from "notistack";
import { useIntl } from 'react-intl';

// project imports
import SalaryForm from "../../sections/salary-calculator-form/SalaryCalculatorForm";

// utils
import { getWorkedDaysInMonth } from '../../utils/monthHelperFunc';
import { getPolishHolidays } from "../../utils/getHolidays";
import { calculateTaxesContractOfMandate, calculateTaxesUoP, calculateTaxesUoD } from '../../utils/workTypeSalaryCalc';

// supabase api
import { createUopSalary } from '../../api/UoP';
import { createMandateSalary } from '../../api/CoM';
import { createUoDSalary } from "../../api/UoD";

// types
import type { SalaryCalculatorValues } from '../../types/salaryCalculator';

// for test
import { overrideSalaryCalculations } from "../../api/overrideSalaryCalculations";

const now = new Date();

const getBonusTotal = (values: SalaryCalculatorValues) =>
  Math.round(
    (values.bonuses ?? []).reduce(
      (sum, bonus) => sum + Math.max(0, Number(bonus.amount) || 0),
      0,
    ) * 100,
  ) / 100;

export const initialSalaryFormValues: SalaryCalculatorValues = {
  // podatki i potrącenia
  // legacy fields - kept so existing API/update flows do not break
  taxRegime: 12,
  pit2: false,

  // PIT / KUP
  pit2MonthlyReduction: 0,
  uopKup: 250,
  hasMultipleEmploymentRelationships: false,
  kup: 20,
  pit0Relief: 'none',
  isStudent: false,
  isUnder26: false,
  doNotWithholdPitAdvance: false,
  uopEmployerSickPayLimit: 33,
  previousEmployerSickPayDays: 0,

  // annual state before the calculated month
  // TODO: populate automatically from salary history once API/history aggregation is connected
  previousTaxableIncome: 0,
  previousPit0Revenue: 0,
  previousPensionDisabilityBase: 0,
  previous50KupUsed: 0,
  previousUopKupUsed: 0,

  // UZ / UoD insurance status
  mandateVoluntarySicknessInsurance: false,
  mandateSicknessBenefitEligible: false,
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

  // Kalendarz i norma czasu pracy
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  workingHours: getWorkedDaysInMonth(now.getFullYear(), now.getMonth(), [], [], [])*8,

  // Stawka i premie
  workRateType: 'uop_monthly',
  rate: 0,
  bonuses: [],

  holidays: [],

  // Nadgodziny i godziny nocne
  dailyOvertime: 0,
  weekendHolidayOvertime: 0,
  nightOvertime: 0,

  nightHours: 0,
  turnOfDayHours: 0,

  overtimeLimit: 30,

  // Zwolnienie lekarskie (L4)
  l4: [],
  l4Base: 0,

  // Urlop
  leave: [],
  leaveBase: 0,

  // --- For edit form ---
  isOverride: false,
  netSalaryOverride: null,
  grossSalaryOverride: null,
  reason: null
};

console.log(getPolishHolidays(now.getFullYear()));

export default function CreateSalaryPage() {

  const intl = useIntl();
  const { enqueueSnackbar } = useSnackbar();

  const navigate = useNavigate();

  const navigateToSalaries = () => {
    navigate({
      pathname: '/salaries'
    })
  }

  const handleOverride = async (id: string, values: SalaryCalculatorValues) => {
    if (values.netSalaryOverride || values.grossSalaryOverride) {
      await overrideSalaryCalculations(id, {
        netSalaryOverride: values.netSalaryOverride,
        grossSalaryOverride: values.grossSalaryOverride,
        reason: values.reason
      });
    }
  };

  // IMPORTANT:
  // The supplied API files/database schema still use the old
  // attendanceBonus/discretionaryBonus/otherBonus columns.
  //
  // Until those files and the database are migrated to persist bonuses[] as
  // structured data, this create flow stores only the TOTAL in the old
  // "other/discretionary" compatibility column. That keeps current gross/net
  // persistence working, but amountType/sickLeaveTreatment are not persisted.
  const handleCreate = async (values: SalaryCalculatorValues) => {

    try {
      let salary_id: string | null = null;
      const bonusTotal = getBonusTotal(values);

      if (values.workRateType === 'mandate_hourly') {
        const calculated = calculateTaxesContractOfMandate(values);

        salary_id = await createMandateSalary({
          year: values.year,
          month: values.month,

          brutto: calculated.brutto,
          netto: calculated.netto,
          workingHours: values.workingHours,

          rate: values.rate,
          additionAfterTax: values.additionAfterTax,
          deductionAfterTax: values.deductionAfterTax,
          kup: values.kup,
          isStudent: values.isStudent,
          isUnder26: values.isUnder26,
          pit2: values.pit2,

          // Temporary DB compatibility bridge.
          attendanceBonus: 0,
          discretionaryBonus: 0,
          otherBonus: bonusTotal,

          holidays: values.holidays
        });

      } else if (values.workRateType === 'uop_monthly' || values.workRateType === 'uop_hourly') {
        const calculated = calculateTaxesUoP(values);

        salary_id = await createUopSalary({
          year: values.year,
          month: values.month,

          workRateType: values.workRateType,

          brutto: calculated.brutto,
          netto: calculated.netto,
          workingHours: values.workingHours,

          rate: values.rate,
          additionAfterTax: values.additionAfterTax,
          deductionAfterTax: values.deductionAfterTax,
          taxRegime: values.taxRegime,
          pit2: values.pit2,

          // Temporary DB compatibility bridge.
          attendanceBonus: 0,
          discretionaryBonus: 0,
          otherBonus: bonusTotal,

          dailyOvertime: values.dailyOvertime,
          weekendHolidayOvertime: values.weekendHolidayOvertime,
          nightOvertime: values.nightOvertime,

          nightHours: values.nightHours,
          turnOfDayHours: values.turnOfDayHours,

          holidays: values.holidays,

          l4: values.l4,
          l4Base: values.l4Base,

          leave: values.leave,
          leaveBase: values.leaveBase
        });
      } else if (values.workRateType === 'uod_fixed') {
        const calculated = calculateTaxesUoD(values);

        salary_id = await createUoDSalary({
          year: values.year,
          month: values.month,
          contractType: 'uod',
          paymentMode: 'fixed',

          brutto: calculated.brutto,
          netto: calculated.netto,

          rate: values.rate,
          additionAfterTax: values.additionAfterTax,
          deductionAfterTax: values.deductionAfterTax,
          kup: values.kup,
          pit2: values.pit2,

          // Temporary DB compatibility bridge.
          discretionaryBonus: bonusTotal,
        })
      }

      if (!salary_id) {
        throw new Error("Failed to create salary");
      }

      await handleOverride(salary_id, values);
      enqueueSnackbar(intl.formatMessage({id: 'salary-saved'}), { variant: "success" });
      navigateToSalaries();

    } catch (e) {
      console.error(e);
      enqueueSnackbar(intl.formatMessage({id: 'error'}), { variant: "error" });
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
