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

import { calculateTaxesContractOfMandate, calculateTaxesUoP, calculateTaxesUoD } from '../../utils/workTypeSalaryCalc';

// supabase api
import { createUopSalary } from '../../api/UoP';
import { createMandateSalary } from '../../api/CoM';
import { createUoDSalary } from "../../api/UoD";

// types
import type { SalaryCalculatorValues } from '../../types/salaryCalculator';

// for test
import { login } from '../../api/authUser';
import { overrideSalaryCalculations } from "../../api/overrideSalaryCalculations";

const now = new Date();

export const initialSalaryFormValues: SalaryCalculatorValues = {
  // podatki i potracenia
  taxRegime: 12,
  pit2: false, // umowa o prace

  kup: 20, // umowa zelcenia
  isStudent: false, // tylko dla umowy zlecenia
  isUnder26: false, // tylko dla umowy zlecenia

  deductionAfterTax: 0,
  additionAfterTax: 0,

  // Kalendarz i norma czasu pracy
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  workingHours: getWorkedDaysInMonth(now.getFullYear(), now.getMonth(), [], [], [])*8,

  // Stawka i premie
  workRateType: 'uop_monthly',
  rate: 0,
  attendanceBonus: 0,
  discretionaryBonus: 0,
  otherBonus: 0,

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

  const handleCreate = async (values: SalaryCalculatorValues) => {

    try {
      // login
      const session = await login('aleks19802@o2.pl', '123');

      let salary_id: string | null = null;

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

          attendanceBonus: values.attendanceBonus,
          discretionaryBonus: values.discretionaryBonus,
          otherBonus: values.otherBonus,
          
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

          attendanceBonus: values.attendanceBonus,
          discretionaryBonus: values.discretionaryBonus,
          otherBonus: values.otherBonus,

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

          discretionaryBonus: values.discretionaryBonus,
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