import type { SalaryCalculatorValues } from '../types/salaryCalculator';

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const getBonusTotals = (values: Pick<SalaryCalculatorValues, "bonuses">) => {
  let cashBonusTotal = 0;
  let nonCashBonusTotal = 0;

  (values.bonuses ?? []).forEach((bonus) => {
    const amount = Math.max(0, Number(bonus.amount) || 0);

    if (bonus.paymentType === 'nonCash') {
      nonCashBonusTotal += amount;
    } else {
      // Undefined is treated as cash for backwards compatibility.
      cashBonusTotal += amount;
    }
  });

  cashBonusTotal = round2(cashBonusTotal);
  nonCashBonusTotal = round2(nonCashBonusTotal);

  return {
    cashBonusTotal,
    nonCashBonusTotal,
    bonusTotal: round2(cashBonusTotal + nonCashBonusTotal),
  };
};

