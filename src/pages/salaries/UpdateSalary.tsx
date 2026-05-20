import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, useSearchParams } from 'react-router';

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

import { calculateTaxesContractOfMandate, calculateTaxesUoD, calculateTaxesUoP } from '../../utils/workTypeSalaryCalc';

// supabase api
import { updateUopSalary } from '../../api/UoP';
import { updateMandateSalary } from '../../api/CoM';
import { updateUoDSalary } from "../../api/UoD";

import { getSalaryContract } from "../../api/getSalaryContract";

import { overrideSalaryCalculations, deleteSalaryOverride } from "../../api/overrideSalaryCalculations";

// types
import type { SalaryCalculatorValues } from '../../types/salaryCalculator';
import type { WorkRate } from "../../types/salaryCalculator";

// for test
import { login } from '../../api/authUser';

export default function UpdateSalary() {

  const { id } = useParams();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const intl = useIntl();
  const { enqueueSnackbar } = useSnackbar();

  const [initialValues, setInitialValues] = useState<SalaryCalculatorValues | null>(null);

  useEffect(() => {
    if (!id) return;

    const now = new Date();

    const loadData = async () => {
      try {
        const data = await getSalaryContract(id);

        const salaryRecord = data?.salary_record ?? {};
        const inputs = data?.inputs ?? {};
        const override = data?.override ?? null;

        setInitialValues({
          // Podatki i potrącenia
          taxRegime: inputs?.tax_regime ?? 12,
          pit2: inputs?.pit2 ?? false,

          kup: inputs?.kup ?? 20,
          isStudent: inputs?.is_student ?? false,
          isUnder26: inputs?.is_under26 ?? false,

          deductionAfterTax: inputs?.deduction_after_tax ?? 0,
          additionAfterTax: inputs?.addition_after_tax ?? 0,

          // Kalendarz
          year: salaryRecord?.year ?? now.getFullYear(),
          month: salaryRecord?.month ?? now.getMonth() + 1,

          workingHours:
            inputs?.working_hours ??
            getWorkedDaysInMonth(
              salaryRecord?.year ?? now.getFullYear(),
              (salaryRecord?.month ?? now.getMonth() + 1) - 1,
              inputs?.holidays ?? [],
              inputs?.l4 ?? [],
              inputs?.leave ?? []
            ) * 8,

          // Stawka
          workRateType: (salaryRecord?.contract_type && salaryRecord?.payment_mode) 
              ? `${salaryRecord.contract_type}_${salaryRecord.payment_mode}` as WorkRate
              : 'uop_monthly',
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
          l4Base: inputs?.l4_base ?? 0,

          // Urlop
          leave: inputs?.leave ?? [],
          leaveBase: inputs?.leave_base ?? 0,

          // --- For edit form ---
          isOverride: override ? true : false,
          netSalaryOverride: override?.netSalaryOverride ?? null,
          grossSalaryOverride: override?.grossSalaryOverride ?? null,
          reason: override?.reason ?? null
        });
      } catch (error) {
        console.error("Failed to load salary contract:", error);
      }
    };

    loadData();
  }, [id]);

  const navigateToSalaries = () => {
    navigate({
      pathname: '/salaries',
      search: searchParams.toString()
    })
  }

  const deleteOverride = async () => {
    if (!id || (initialValues?.isOverride === undefined || !initialValues?.isOverride )) return;
    try {
      await deleteSalaryOverride(id);
      setInitialValues(prev => prev ? {
        ...prev,
        isOverride: false,
        netSalaryOverride: null,
        grossSalaryOverride: null,
        reason: null
      } : prev);
      enqueueSnackbar(intl.formatMessage({id: "salary-override-deleted"}), { variant: "success" });
    } catch (e) {
      console.error(e);
      enqueueSnackbar(intl.formatMessage({id: 'error'}), { variant: "error" });
    }
  };

  const handleUpdate = async (values: SalaryCalculatorValues) => {
    if (!id) return;
    try {
      // login
      const session = await login('aleks19802@o2.pl', '123');

      if (values.workRateType === 'mandate_hourly') {
        const calculated = calculateTaxesContractOfMandate(values);

        await updateMandateSalary(id, {
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
        })
      } else if (values.workRateType === 'uop_monthly' || values.workRateType === 'uop_hourly') {
        const calculated = calculateTaxesUoP(values);

        await updateUopSalary(id, {
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

        await updateUoDSalary(id, {
          year: values.year,
          month: values.month,

          brutto: calculated.brutto,
          netto: calculated.netto,

          rate: values.rate,
          additionAfterTax: values.additionAfterTax,
          deductionAfterTax: values.deductionAfterTax,
          kup: values.kup,
          pit2: values.pit2,

          discretionaryBonus: values.discretionaryBonus,
        })
      };

      const isChanged = initialValues && (
        values.netSalaryOverride !== initialValues.netSalaryOverride ||
        values.grossSalaryOverride !== initialValues.grossSalaryOverride ||
        values.reason !== initialValues.reason
      );

      if (isChanged) {
        await overrideSalaryCalculations(id, {
          netSalaryOverride: values.netSalaryOverride,
          grossSalaryOverride: values.grossSalaryOverride,
          reason: values.reason
        });
      }

      enqueueSnackbar(intl.formatMessage({id: 'salary-saved'}), { variant: "success" });

      navigateToSalaries();

    } catch (e) {
      console.error(e);
      enqueueSnackbar(intl.formatMessage({id: 'error'}), { variant: "error" });
    }
  };

  if (!initialValues) return (<></>);
  return (
    <SalaryForm
      initialValues={initialValues as SalaryCalculatorValues}
      deleteOverride={deleteOverride}
      onSubmit={handleUpdate}
      type={'update'}
    />
  );
}