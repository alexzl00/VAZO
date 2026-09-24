import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

// third parties
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useSnackbar } from "notistack";
import { useIntl } from "react-intl";

dayjs.extend(isSameOrBefore);

// project imports
import SalaryForm from "../../sections/salary-calculator-form/SalaryCalculatorForm";

// utils
import {
  calculateTaxesContractOfMandate,
  calculateTaxesUoD,
  calculateTaxesUoP
} from "../../utils/workTypeSalaryCalc";

// supabase api
import { updateUopSalary } from "../../api/UoP";
import { updateMandateSalary } from "../../api/CoM";
import { updateUoDSalary } from "../../api/UoD";
import { getSalaryContract } from "../../api/getSalaryContract";
import {
  deleteSalaryOverride,
  overrideSalaryCalculations
} from "../../api/overrideSalaryCalculations";

// types
import { normalizeL4Ranges } from "../../types/salaryCalculator";
import type {
  SalaryCalculatorValues,
  WorkRate
} from "../../types/salaryCalculator";

const getWorkRateType = (
  contractType?: string,
  paymentMode?: string
): WorkRate => {
  if (contractType && paymentMode) {
    return `${contractType}_${paymentMode}` as WorkRate;
  }

  return "uop_monthly";
};

export default function UpdateSalary() {
  const { id } = useParams();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const intl = useIntl();
  const { enqueueSnackbar } = useSnackbar();

  const [initialValues, setInitialValues] =
    useState<SalaryCalculatorValues | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const data = await getSalaryContract(id);

        if (!data) {
          throw new Error("Salary contract not found.");
        }

        const salaryRecord = data.salary_record ?? {};
        const inputs = data.inputs ?? {};
        const override = data.override;
        const calculationSettings = data.calculationSettings ?? {};

        setInitialValues({
          // PIT / KUP
          pit2MonthlyReduction:
            inputs.pit2_monthly_reduction ?? 0,

          uopKup:
            inputs.uop_kup ?? 250,

          hasMultipleEmploymentRelationships:
            inputs.has_multiple_employment_relationships ?? false,

          kup:
            inputs.kup ?? 20,

          pit0Relief:
            inputs.pit0_relief ?? "none",

          isStudent:
            inputs.is_student ?? false,

          isUnder26:
            inputs.is_under_26 ?? false,

          previousTaxableIncome:
            inputs.previous_taxable_income ?? 0,

          previousPit0Revenue:
            inputs.previous_pit0_revenue ?? 0,

          previousPensionDisabilityBase:
            inputs.previous_pension_disability_base ?? 0,

          // DB name is previous_copyright_kup_used.
          // Current calculator/form property stays previous50KupUsed for now.
          previous50KupUsed:
            inputs.previous_copyright_kup_used ?? 0,

          previousUopKupUsed:
            inputs.previous_uop_kup_used ?? 0,

          doNotWithholdPitAdvance:
            inputs.do_not_withhold_pit_advance ?? false,

          // UoP sickness
          uopEmployerSickPayLimit:
            inputs.uop_employer_sick_pay_limit ?? 33,

          previousEmployerSickPayDays:
            inputs.previous_employer_sick_pay_days ?? 0,

          // UZ / UoD status
          mandateVoluntarySicknessInsurance:
            inputs.mandate_voluntary_sickness_insurance ?? false,

          mandateSicknessBenefitEligible:
            inputs.mandate_sickness_benefit_eligible ?? false,

          mandateHasOtherUopAtLeastMinimumBase:
            inputs.mandate_has_other_uop_at_least_minimum_base ?? false,

          mandateOtherSocialBaseBeforeThisContract:
            inputs.mandate_other_social_base_before_this_contract ?? 0,

          isOwnEmployerContract:
            inputs.is_own_employer_contract ?? false,

          performedForOwnEmployer:
            inputs.performed_for_own_employer ?? false,

          smallContractLumpSumEligible:
            inputs.small_contract_lump_sum_eligible ?? false,

          // PPK
          ppkEnabled:
            inputs.ppk_enabled ?? false,

          ppkEmployeeRate:
            inputs.ppk_employee_rate ?? 2,

          ppkEmployerRate:
            inputs.ppk_employer_rate ?? 1.5,

          ppkEmployerTaxableContribution:
            inputs.ppk_employer_taxable_contribution ?? undefined,

          // Final adjustments
          deductionAfterTax:
            inputs.deduction_after_tax ?? 0,

          additionAfterTax:
            inputs.addition_after_tax ?? 0,

          // Work relation / persisted effective period
          workRelationId:
            salaryRecord.work_relation_id ?? null,

          employmentStartDate:
            salaryRecord.employment_start_date ?? null,

          employmentEndDate:
            salaryRecord.employment_end_date ?? null,

          // Calendar
          year:
            salaryRecord.year ?? new Date().getFullYear(),

          month:
            salaryRecord.month ?? new Date().getMonth() + 1,

          workingHours:
            inputs.working_hours ?? 0,

          // Rate / bonuses
          workRateType: getWorkRateType(
            salaryRecord.contract_type,
            salaryRecord.payment_mode
          ),

          rate:
            inputs.rate ?? 0,

          hourlyRateCalculationMode:
            calculationSettings.hourlyRateCalculationMode === "fullPrecision"
              ? "fullPrecision"
              : "roundedTo2",

          bonuses:
            data.bonuses ?? [],

          holidays:
            inputs.holidays ?? [],

          // Overtime / night work
          dailyOvertime:
            inputs.daily_overtime ?? 0,

          weekendHolidayOvertime:
            inputs.weekend_holiday_overtime ?? 0,

          nightOvertime:
            inputs.night_overtime ?? 0,

          nightHours:
            inputs.night_hours ?? 0,

          turnOfDayHours:
            inputs.turn_of_day_hours ?? 0,

          overtimeLimit:
            inputs.overtime_limit ?? 30,

          // L4
          l4:
            normalizeL4Ranges(inputs.l4 ?? []),

          l4Base:
            inputs.l4_base ?? 0,

          // Leave
          leave:
            inputs.leave ?? [],

          leaveBase:
            inputs.leave_base ?? 0,

          // Override
          isOverride:
            Boolean(override),

          netSalaryOverride:
            override?.netSalaryOverride ?? null,

          grossSalaryOverride:
            override?.grossSalaryOverride ?? null,

          reason:
            override?.reason ?? null
        });
      } catch (error) {
        console.error("Failed to load salary contract:", error);

        enqueueSnackbar(
          intl.formatMessage({ id: "error" }),
          { variant: "error" }
        );
      }
    };

    loadData();
  }, [id, enqueueSnackbar, intl]);

  const navigateToSalaries = () => {
    navigate({
      pathname: "/salaries",
      search: searchParams.toString()
    });
  };

  const deleteOverride = async () => {
    if (!id || !initialValues?.isOverride) return;

    try {
      await deleteSalaryOverride(id);

      setInitialValues((prev) =>
        prev
          ? {
              ...prev,
              isOverride: false,
              netSalaryOverride: null,
              grossSalaryOverride: null,
              reason: null
            }
          : prev
      );

      enqueueSnackbar(
        intl.formatMessage({ id: "salary-override-deleted" }),
        { variant: "success" }
      );
    } catch (error) {
      console.error(error);

      enqueueSnackbar(
        intl.formatMessage({ id: "error" }),
        { variant: "error" }
      );
    }
  };

  const saveOverrideChanges = async (
    values: SalaryCalculatorValues
  ) => {
    if (!id || !initialValues) return;

    const hasOverride =
      values.netSalaryOverride !== null ||
      values.grossSalaryOverride !== null;

    const hadOverride = initialValues.isOverride;

    if (!hasOverride) {
      if (hadOverride) {
        await deleteSalaryOverride(id);
      }

      return;
    }

    const changed =
      values.netSalaryOverride !== initialValues.netSalaryOverride ||
      values.grossSalaryOverride !== initialValues.grossSalaryOverride ||
      values.reason !== initialValues.reason;

    if (!hadOverride || changed) {
      await overrideSalaryCalculations(id, {
        netSalaryOverride: values.netSalaryOverride,
        grossSalaryOverride: values.grossSalaryOverride,
        reason: values.reason
      });
    }
  };

  const handleUpdate = async (values: SalaryCalculatorValues) => {
    if (!id) return;

    try {
      if (values.workRateType === "mandate_hourly") {
        const calculated = calculateTaxesContractOfMandate(values);

        await updateMandateSalary(id, {
          ...values,
          brutto: calculated.brutto,
          netto: calculated.netto
        });
      } else if (
        values.workRateType === "uop_monthly" ||
        values.workRateType === "uop_hourly"
      ) {
        const calculated = calculateTaxesUoP(values);

        await updateUopSalary(id, {
          ...values,
          brutto: calculated.brutto,
          netto: calculated.netto
        });
      } else if (values.workRateType === "uod_fixed") {
        const calculated = calculateTaxesUoD(values);

        await updateUoDSalary(id, {
          ...values,
          brutto: calculated.brutto,
          netto: calculated.netto
        });
      }

      await saveOverrideChanges(values);

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

  if (!initialValues) return null;

  return (
    <SalaryForm
      initialValues={initialValues}
      deleteOverride={deleteOverride}
      onSubmit={handleUpdate}
      type="update"
    />
  );
}
