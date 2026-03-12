import { countDays, getWorkedDaysInMonth } from '../utils/monthHelperFunc';
import type { SalaryCalculatorValues } from '../types/salaryCalculator';

export const taxes = {
  // Podatki PIT
  zusPensionInsurance: 9.76, // %
  zusDisability: 1.5, // %
  zusSicknessInsurance: 2.45, // %
  taxDeductibaleExpenses: 250, // KUP zł
  PIT2_relief: 300, // zł

  // overtimes
  dailyOvertime: 150, // +50%
  weekendHolidayOvertime: 200, // +100%
  nightOvertime: 220, // +120%

  nightHours: 20, // +20%

  turnOfDayHours: 50, // it will be counted separately as extra +50%
}

export const calculateTaxesContractOfMandate = (values: SalaryCalculatorValues) => {
  const fullSalaryBrutto = values.rate * values.workingHours;

  const zusTaxes = (values.isStudent && values.isUnder26)
    ? 0
    : Math.round(fullSalaryBrutto*taxes.zusPensionInsurance +
      fullSalaryBrutto*taxes.zusDisability)/100

  const healthInsurance = (values.isStudent && values.isUnder26)
    ? 0
    : (fullSalaryBrutto-zusTaxes)*0.09;

  const pitBase = (fullSalaryBrutto-zusTaxes) * (100-values.kup) / 100;
  let pit = values.isUnder26
    ? 0
    : (pitBase * 0.12);
  pit = values.pit2 ? Math.max(pit-taxes.PIT2_relief, 0) : pit

  const netto = fullSalaryBrutto - zusTaxes - healthInsurance - pit - values.deductionAfterTax + values.additionAfterTax;

  console.log("ZUS "+zusTaxes, "healthInsurance " +healthInsurance, "pitBase "+pitBase, "pit "+pit, "netto " + netto);

  return {
    zusTaxes: zusTaxes,
    healthInsurance: healthInsurance,
    pitTax: pit,
    brutto: fullSalaryBrutto,
    netto: netto
  }
}

export const calculateTaxesUoP = (values: SalaryCalculatorValues) => {
  const workingDaysInMonth = getWorkedDaysInMonth(values.year, values.month-1, values.holidays, values.l4, values.leave)

  const l4DaysCount = countDays(values.l4)
  const l4Payment = (values.l4Base / 30) * l4DaysCount * 0.8;

  const leaveDaysCount = countDays(values.leave);
  const leavePayment = (values.leaveBase / getWorkedDaysInMonth(values.year, values.month-1, values.holidays, [], [])) * leaveDaysCount;

  const perHour = values.workRateType === 'hourly' ? values.rate : values.rate / values.workingHours

  const workDaysPayment = workingDaysInMonth * perHour * 8;

  const overtimes = perHour*(values.dailyOvertime*taxes.dailyOvertime + 
    values.weekendHolidayOvertime*taxes.weekendHolidayOvertime + 
    values.nightOvertime*taxes.nightOvertime + 
    values.nightHours*taxes.nightHours +
    values.turnOfDayHours*taxes.turnOfDayHours
  ) / 100;

  const fullSalaryBrutto = workDaysPayment + l4Payment + leavePayment +
    values.attendanceBonus + 
    values.discretionaryBonus + 
    values.otherBonus +
    overtimes;
  console.log(workDaysPayment, values.attendanceBonus, values.discretionaryBonus, values.otherBonus)

  const zusTaxes = Math.round(fullSalaryBrutto*taxes.zusPensionInsurance +
    fullSalaryBrutto*taxes.zusDisability +
    fullSalaryBrutto*taxes.zusSicknessInsurance
  )/100

  const healthInsurance = Math.round((fullSalaryBrutto-zusTaxes)*9) / 100;

  let pitTax = (fullSalaryBrutto-zusTaxes-taxes.taxDeductibaleExpenses) * (values.taxRegime/100);
  if (values.pit2) {
    pitTax -= taxes.PIT2_relief;
  }
  pitTax = Math.max(0, pitTax);
  pitTax = Math.round(pitTax * 100) / 100;

  const netto = fullSalaryBrutto - zusTaxes - healthInsurance - pitTax - values.deductionAfterTax + values.additionAfterTax;

  const format = (v: number) =>
  new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

  console.group("💰 Salary Calculation - FULL BREAKDOWN");

  console.group("📅 Month & Days");
  console.table({
    year: values.year,
    month: values.month,
    workingDaysInMonth,
    l4DaysCount,
    //l4WorkingDays,
    leaveDaysCount,
    actualWorkedDays: workingDaysInMonth
      //workingDaysInMonth - l4WorkingDays - leaveDaysCount,
  });
  console.groupEnd();

  console.group("⏱ Hour & Base Rates");
  console.table({
    monthlyRate: format(values.rate),
    leaveBase: format(values.leaveBase),
    workingHoursInMonth: values.workingHours,
    perHour: format(perHour),
    perWorkDay: format(perHour * 8),
  });
  console.groupEnd();

  console.group("💵 Earnings");
  console.table({
    workDaysPayment: format(workDaysPayment),
    l4Payment: format(l4Payment),
    leavePayment: format(leavePayment),
    attendanceBonus: format(values.attendanceBonus),
    discretionaryBonus: format(values.discretionaryBonus),
    otherBonus: format(values.otherBonus),
    overtimes: format(overtimes),
    fullSalaryBrutto: format(fullSalaryBrutto),
  });
  console.groupEnd();

  console.group("🏛 Taxes");
  console.table({
    zusTaxes: format(zusTaxes),
    healthInsurance: format(healthInsurance),
    pitTax: format(pitTax),
  });
  console.groupEnd();

  console.group("🧾 Final Result");
  console.table({
    netto: format(netto),
    deductionAfterTaxInput: format(values.deductionAfterTax),
  });
  console.groupEnd();

  console.groupEnd();
  return {
    zusTaxes: zusTaxes,
    healthInsurance: healthInsurance,
    pitTax: pitTax,
    brutto: fullSalaryBrutto,
    netto: netto
  }
}