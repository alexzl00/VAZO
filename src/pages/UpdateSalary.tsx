import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

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
import { updateUopSalary } from '../api/UoP';
import { updateMandateSalary } from '../api/CoM';
import { getSalaryContract } from "../api/getSalaryContract";

// types
import type { SalaryCalculatorValues } from '../types/salaryCalculator';

// for test
import { login } from '../api/authUser';

export default function UpdateSalary() {

  const { id } = useParams();

  const intl = useIntl();
  const { enqueueSnackbar } = useSnackbar();

  const [initialValues, setInitialValues] = useState<SalaryCalculatorValues | null>(null);

  useEffect(() => {
    if (!id) return;

    const now = new Date();

    const loadData = async () => {
      try {
        const data = await getSalaryContract(id);
        console.log("Loaded salary contract:", data);

        const salaryRecord = data?.salary_record ?? {};
        const inputs = data?.inputs ?? {};

        setInitialValues({
          // Podatki i potrącenia
          taxRegime: inputs?.tax_regime ?? 12,
          pit2: inputs?.pit2 ?? false,

          kup: inputs?.kup ?? 20,
          isStudent: inputs?.is_student ?? false,
          isUnder26: inputs?.is_under26 ?? false,

          deductionAfterTax: 0,
          additionAfterTax: 0,

          // Kalendarz
          year: salaryRecord?.year ?? now.getFullYear(),
          month: salaryRecord?.month ?? now.getMonth() + 1,

          workingHours:
            salaryRecord?.working_hours ??
            getWorkedDaysInMonth(
              now.getFullYear(),
              now.getMonth(),
              [],
              [],
              []
            ) * 8,

          // Stawka
          workRateType: salaryRecord?.payment_mode ?? "monthly",
          rate: inputs?.rate ?? 0,

          attendanceBonus: inputs?.attendance_bonus ?? 0,
          discretionaryBonus: inputs?.discretionary_bonus ?? 0,
          otherBonus: inputs?.other_bonus ?? 0,

          holidays: inputs?.holidays ?? [],

          // Nadgodziny
          dailyOvertime: inputs?.daily_overtime ?? 0,
          weekendHolidayOvertime: inputs?.weekend_overtime ?? 0,
          nightOvertime: inputs?.night_overtime ?? 0,

          nightHours: inputs?.night_hours ?? 0,
          turnOfDayHours: inputs?.turn_of_day_hours ?? 0,

          overtimeLimit: 30,

          // L4
          l4: inputs?.l4 ?? [],
          l4Base: 0,

          // Urlop
          leave: inputs?.leave ?? [],
          leaveBase: 0
        });
      } catch (error) {
        console.error("Failed to load salary contract:", error);
      }
    };

    loadData();
  }, [id]);

  const handleUpdate = async (values: SalaryCalculatorValues) => {
    if (!id) return;
    try {
      // login
      const session = await login('aleks19802@o2.pl', '123');

      if (values.workRateType === "contractOfMandate") {
        const calculated = calculateTaxesContractOfMandate(values);

        await updateMandateSalary(id, {
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

        await updateUopSalary(id, {
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

  if (!initialValues) return (<></>);
  return (
    <SalaryForm
      initialValues={initialValues as SalaryCalculatorValues}
      onSubmit={handleUpdate}
    />
  );
}