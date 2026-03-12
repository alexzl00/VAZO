
// third parties
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);

import { useSnackbar } from "notistack";
import { useIntl } from 'react-intl';

// project imports
import SalaryForm from "../sections/salary-calculator-form/SalaryCalculatorForm";

// utils 
import { getWorkedDaysInMonth } from '../utils/monthHelperFunc';

import { calculateTaxesContractOfMandate, calculateTaxesUoP } from '../utils/workTypeSalaryCalc';

// supabase api
import { createUopSalary } from '../api/UoP';
import { createMandateSalary } from '../api/CoM';

// types
import type { SalaryCalculatorValues } from '../types/salaryCalculator';

// for test
import { login } from '../api/authUser';

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
  workRateType: 'monthly',
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

  leaveBase: 0
};

export default function CreateSalaryPage() {

  const intl = useIntl();
  const { enqueueSnackbar } = useSnackbar();

  const handleCreate = async (values: SalaryCalculatorValues) => {

    try {
      // login
      const session = await login('aleks19802@o2.pl', '123');

      if (values.workRateType === "contractOfMandate") {
        const calculated = calculateTaxesContractOfMandate(values);

        await createMandateSalary({
          year: values.year,
          month: values.month,

          brutto: calculated.brutto,
          netto: calculated.netto,
          workingHours: values.workingHours,

          rate: values.rate,
          kup: values.kup,
          isStudent: values.isStudent,
          isUnder26: values.isUnder26,
          pit2: values.pit2,

          holidays: values.holidays
        })
      } else if (values.workRateType === 'monthly' || values.workRateType === 'hourly') {
        const calculated = calculateTaxesUoP(values);

        await createUopSalary({
          year: values.year,
          month: values.month,

          workRateType: values.workRateType,

          brutto: calculated.brutto,
          netto: calculated.netto,
          workingHours: values.workingHours,

          rate: values.rate,
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

          leave: values.leave
        });
      }

      enqueueSnackbar(intl.formatMessage({id: 'salary-saved'}), { variant: "success" });

    } catch (e) {
      console.error(e);
      enqueueSnackbar(intl.formatMessage({id: 'error'}), { variant: "error" });
    }
  };

  const handleSave = async () => {
    try {
      // login
      const session = await login('aleks19802@o2.pl', '123');

      // const mandate_save = await createMandateSalary({
      //   year: 2026,
      //   month: 3,

      //   brutto: 8200,
      //   netto: 6150,
      //   workingHours: 170,

      //   rate: 35,
      //   kup: 20,
      //   isStudent: true,
      //   isUnder26: true,
      //   pit2: false,

      //   holidays: [{"start":"2026-03-02","end":"2026-03-09"}]
      // })

      // const mandate_update = await updateMandateSalary("3c796acd-5505-40ee-b19a-60817911e9b5", {
      //   year: 2026,
      //   month: 3,

      //   brutto: 2000,
      //   netto: 500,
      //   workingHours: 100,

      //   rate: 20,
      //   kup: 20,
      //   isStudent: true,
      //   isUnder26: true,
      //   pit2: false,

      //   holidays: [{"start":"2026-03-02","end":"2026-03-09"}]
      // })

      // save hipothetical UoP
      // const UoP_save = await createUopSalary({
      //   year: 2026,
      //   month: 3,

      //   workRateType: 'monthly',

      //   brutto: 8500,
      //   netto: 6100,
      //   workingHours: 168,

      //   rate: 8500,
      //   taxRegime: 12,
      //   pit2: true,

      //   attendanceBonus: 300,
      //   discretionaryBonus: 500,
      //   otherBonus: 0,

      //   dailyOvertime: 4,
      //   weekendHolidayOvertime: 2,
      //   nightOvertime: 3,

      //   nightHours: 10,
      //   turnOfDayHours: 8,

      //   holidays: null,

      //   l4: [{"start":"2026-03-02","end":"2026-03-09"}],

      //   leave: [{"start":"2026-03-01","end":"2026-03-01"}]
      // });

      // const UoP_update = await updateUopSalary("ed8e8f42-8d48-484c-b069-eda652f9578e", {
      //   year: 2026,
      //   month: 3,

      //   workRateType: 'monthly',

      //   brutto: 3000,
      //   netto: 700,
      //   workingHours: 100,

      //   rate: 3000,
      //   taxRegime: 12,
      //   pit2: true,

      //   attendanceBonus: 300,
      //   discretionaryBonus: 500,
      //   otherBonus: 0,

      //   dailyOvertime: 4,
      //   weekendHolidayOvertime: 2,
      //   nightOvertime: 3,

      //   nightHours: 10,
      //   turnOfDayHours: 8,

      //   holidays: null,

      //   l4: [{"start":"2026-03-02","end":"2026-03-09"}],

      //   leave: [{"start":"2026-03-01","end":"2026-03-01"}]
      // });

      enqueueSnackbar(intl.formatMessage({id: 'salary-saved'}), { variant: "success" });
    } catch (e) {
      enqueueSnackbar(intl.formatMessage({id: 'error'}), { variant: "error" });
      console.error(e);
    }
  }

  return (
    <SalaryForm
      initialValues={initialSalaryFormValues}
      onSubmit={handleCreate}
    />
  );
}