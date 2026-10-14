import {
  Alert,
  Box,
  Button,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Chart as ChartJSInstance } from 'chart.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { useIntl } from 'react-intl';
// types
import type { SalaryCalculationResult } from '../../utils/workTypeSalaryCalc';
ChartJS.register(ArcElement, Tooltip);
type TaxChartProps = {
  calculation: SalaryCalculationResult;
};
type BreakdownItem = {
  label: string;
  value: number | string;
  negative?: boolean;
  unit?: string;
  emphasis?: boolean;
};
type BreakdownGroup = {
  title?: string;
  items: BreakdownItem[];
};
type BreakdownSection = {
  title: string;
  groups: BreakdownGroup[];
};
type SummaryItem = {
  label: string;
  value: string;
  negative?: boolean;
  net?: boolean;
};
const formatNumber = (value: number | undefined, min = 2, max = 2) =>
  (value ?? 0).toLocaleString('pl-PL', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
export default React.memo(function TaxChart({ calculation }: TaxChartProps) {
  const chartRef = useRef<ChartJSInstance<'doughnut'> | null>(null);
  const bruttoRef = useRef(calculation.fullSalaryBrutto);
  const nettoRef = useRef(calculation.netto);
  const [open, setOpen] = useState(false);
  const intl = useIntl();
  const ppkEmployee = calculation.ppkEmployee ?? 0;
  const nonCashBonusTotal =
    calculation.nonCashBonusTotal ??
    calculation.bonuses?.reduce(
      (sum, bonus) =>
        bonus.paymentType === 'nonCash'
          ? sum + Math.max(0, Number(bonus.amount) || 0)
          : sum,
      0,
    ) ??
    0;
  const labels = useMemo(
    () => ['PIT', 'ZUS', 'NFZ', 'PPK', 'NETTO'],
    [],
  );
  const colors = useMemo(
    () => [
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(75, 192, 192, 1)',
    ],
    [],
  );
  useEffect(() => {
    bruttoRef.current = calculation.fullSalaryBrutto;
    nettoRef.current = calculation.netto;
    chartRef.current?.update();
  }, [calculation.fullSalaryBrutto, calculation.netto]);
  const taxData = useMemo(
    () => [
      calculation.fullSalaryBrutto === 0 ? 0 : calculation.pitTax ?? 0,
      calculation.fullSalaryBrutto === 0 ? 0 : calculation.zusTaxes ?? 0,
      calculation.fullSalaryBrutto === 0 ? 0 : calculation.healthInsurance ?? 0,
      calculation.fullSalaryBrutto === 0 ? 0 : ppkEmployee,
      calculation.fullSalaryBrutto === 0 ? 0 : calculation.netto ?? 0,
    ],
    [
      calculation.pitTax,
      calculation.zusTaxes,
      calculation.healthInsurance,
      calculation.netto,
      calculation.fullSalaryBrutto,
      ppkEmployee,
    ],
  );
  const total = useMemo(
    () => taxData.reduce((sum, item) => sum + item, 0),
    [taxData],
  );
  const centerTextPlugin = useMemo<Plugin<'doughnut'>>(
    () => ({
      id: 'centerText',
      afterDatasetsDraw: (chart: any) => {
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.font = '500 20px Poppins';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0a1936';
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.bottom + chartArea.top) / 2;
        ctx.fillText(
          `${nettoRef.current.toLocaleString('pl-PL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} PLN`,
          centerX,
          centerY,
        );
        ctx.fillText(
          intl.formatMessage({ id: 'tax-chart-netto', defaultMessage: 'netto' }),
          centerX,
          centerY + 25,
        );
        ctx.font = '500 14px Poppins';
        ctx.fillStyle = '#636363';
        ctx.fillText(
          `${intl.formatMessage({ id: 'tax-chart-brutto-short', defaultMessage: 'BR.' })} ${bruttoRef.current.toLocaleString('pl-PL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} PLN`,
          centerX,
          centerY + 50,
        );
        ctx.restore();
      },
    }),
    [intl],
  );
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: taxData,
          backgroundColor: colors,
          borderColor: 'rgba(0,0,0,0)',
          hoverBorderColor: colors,
          radius: '95%',
          hoverOffset: 10,
        },
      ],
    }),
    [labels, taxData, colors],
  );
  const withNoData = useMemo(
    () => ({
      labels: [intl.formatMessage({ id: 'tax-chart-no-data', defaultMessage: 'Brak danych' })],
      datasets: [
        {
          data: [1],
          backgroundColor: '#9e9e9e',
          borderColor: 'rgba(0,0,0,0)',
          hoverBorderColor: '#9e9e9e',
          radius: '95%',
          hoverOffset: 10,
        },
      ],
    }),
    [intl],
  );
  const options = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      cutout: '75%',
      animation: { duration: 900 },
      transitions: {
        active: { animation: { duration: 200 } },
        fast: { animation: { duration: 150 } },
      },
      plugins: {
        tooltip: {
          bodyFont: { family: "'Poppins', sans-serif" },
          titleFont: { family: "'Poppins', sans-serif" },
          callbacks: {
            label: (context: any) => {
              const value = context.parsed;
              if (!total) return '0%';
              const percent = ((value / total) * 100).toFixed(1);
              return `${formatNumber(value)} zł (${percent}%)`;
            },
          },
        },
      },
    }),
    [total],
  );
  const breakdownConfig = useMemo<BreakdownSection[]>(() => {
    const bonusTotal =
      calculation.bonusTotal ??
      calculation.bonuses?.reduce(
        (sum, bonus) => sum + bonus.amount,
        0,
      ) ??
      0;
    const isMonthlyUop =
      calculation.calculationType === 'uop' &&
      calculation.workRateType === 'uop_monthly';
    const baseSalary =
      calculation.calculationType === 'uop'
        ? isMonthlyUop
          ? calculation.rate ?? 0
          : calculation.workDaysPayment ?? 0
        : calculation.calculationType === 'mandate'
          ? Math.max(
              0,
              calculation.fullSalaryBrutto -
                bonusTotal -
                (calculation.sicknessBenefit ?? 0),
            )
          : calculation.rate ?? 0;
    const baseItems: BreakdownItem[] = [
      {
        label: intl.formatMessage({
          id: 'salary-monthly-brutto',
          defaultMessage: 'Base remuneration',
        }),
        value: formatNumber(baseSalary),
      },
    ];
    if (calculation.calculationType === 'uop' && (calculation.perHour ?? 0) > 0) {
      baseItems.push({
        label: intl.formatMessage({
          id: 'salary-hourly-rate',
          defaultMessage: 'Hourly rate',
        }),
        value: formatNumber(calculation.perHour),
      });
    }
    if (
      calculation.employmentPeriodStart &&
      calculation.employmentPeriodEnd &&
      (calculation.employmentReduction ?? 0) > 0
    ) {
      baseItems.push({
        label: intl.formatMessage({
          id: 'salary-employment-period',
          defaultMessage: 'Employment period in month',
        }),
        value: `${calculation.employmentPeriodStart} – ${calculation.employmentPeriodEnd}`,
        unit: '',
      });
    }
    if (isMonthlyUop && (calculation.employmentExcludedWorkingHours ?? 0) > 0) {
      baseItems.push({
        label: intl.formatMessage({
          id: 'salary-employment-excluded-hours',
          defaultMessage: 'Working hours outside employment period',
        }),
        value: calculation.employmentExcludedWorkingHours ?? 0,
        unit: 'h',
      });
    }
    const reductionItems: BreakdownItem[] = [];
    if (isMonthlyUop && (calculation.employmentReduction ?? 0) > 0) {
      reductionItems.push({
        label: intl.formatMessage({
          id: 'salary-employment-reduction',
          defaultMessage: 'Reduction for period outside employment',
        }),
        value: formatNumber(calculation.employmentReduction),
        negative: true,
      });
    }
    if (isMonthlyUop && (calculation.l4Reduction ?? 0) > 0) {
      reductionItems.push({
        label: intl.formatMessage({
          id: 'salary-l4-reduction',
          defaultMessage: 'Salary reduction for L4',
        }),
        value: formatNumber(calculation.l4Reduction),
        negative: true,
      });
    }
    if (isMonthlyUop && (calculation.leaveReduction ?? 0) > 0) {
      reductionItems.push({
        label: intl.formatMessage({
          id: 'salary-leave-reduction',
          defaultMessage: 'Salary reduction for annual leave',
        }),
        value: formatNumber(calculation.leaveReduction),
        negative: true,
      });
    }
    const additionalPayItems: BreakdownItem[] = [];
    if (calculation.calculationType === 'uop') {
      const additionalPayCandidates = [
        {
          label: intl.formatMessage({
            id: 'salary-daily-overtimes',
            defaultMessage: 'Overtime +50%',
          }),
          value: calculation.dailyOvertimes,
        },
        {
          label: intl.formatMessage({
            id: 'salary-weekend-holiday-overtimes',
            defaultMessage: 'Overtime +100%',
          }),
          value: calculation.weekendHolidayOvertimes,
        },
        {
          label: intl.formatMessage({
            id: 'salary-night-overtimes',
            defaultMessage: 'Night overtime',
          }),
          value: calculation.nightOvertime,
        },
        {
          label: intl.formatMessage({
            id: 'salary-night-hours',
            defaultMessage: 'Night-work allowance',
          }),
          value: calculation.nightWorkAllowance ?? calculation.nightHours,
        },
        {
          label: intl.formatMessage({
            id: 'salary-turn-of-day-hours',
            defaultMessage: 'Turn-of-day allowance',
          }),
          value: calculation.turnOfDayHours,
        },
      ];
      additionalPayCandidates.forEach(({ label, value }) => {
        if ((value ?? 0) > 0) {
          additionalPayItems.push({
            label,
            value: formatNumber(value),
          });
        }
      });
    }
    const bonusItems: BreakdownItem[] = [];
    if (bonusTotal > 0) {
      bonusItems.push({
        label: intl.formatMessage({
          id: 'salary-bonuses-brutto',
          defaultMessage: 'Bonuses total',
        }),
        value: formatNumber(bonusTotal),
        emphasis: true,
      });
    }
    if (nonCashBonusTotal > 0) {
      bonusItems.push({
        label: intl.formatMessage({
          id: 'salary-non-cash-bonuses',
          defaultMessage: 'Including non-cash benefits (not paid out)',
        }),
        value: formatNumber(nonCashBonusTotal),
      });
    }
    calculation.bonuses
      ?.filter((bonus) => bonus.amount > 0)
      .forEach((bonus) => {
        const bonusLabel = bonus.name
          ? `${intl.formatMessage({
              id: 'salary-bonus-item',
              defaultMessage: 'Bonus',
            })}: ${bonus.name}`
          : intl.formatMessage({
              id: 'salary-bonus-item',
              defaultMessage: 'Bonus',
            });
        const paymentTypeLabel =
          bonus.paymentType === 'nonCash'
            ? ` (${intl.formatMessage({
                id: 'bonus-payment-non-cash',
                defaultMessage: 'Non-cash',
              })})`
            : '';
        bonusItems.push({
          label: `${bonusLabel}${paymentTypeLabel}`,
          value: formatNumber(bonus.amount),
        });
      });
    const absenceItems: BreakdownItem[] = [];
    if (calculation.calculationType === 'uop') {
      if ((calculation.employerSickPay ?? 0) > 0) {
        absenceItems.push({
          label: intl.formatMessage({
            id: 'salary-sick-pay-employer',
            defaultMessage: 'Employer sick pay',
          }),
          value: formatNumber(calculation.employerSickPay),
        });
      }
      if ((calculation.sicknessBenefit ?? 0) > 0) {
        absenceItems.push({
          label: intl.formatMessage({
            id: 'salary-sickness-benefit',
            defaultMessage: 'Sickness benefit',
          }),
          value: formatNumber(calculation.sicknessBenefit),
        });
      }
      if ((calculation.employerSickPayDays ?? 0) > 0) {
        absenceItems.push({
          label: intl.formatMessage({
            id: 'salary-sick-pay-days',
            defaultMessage: 'Employer sick-pay days',
          }),
          value: calculation.employerSickPayDays ?? 0,
          unit: '',
        });
      }
      if ((calculation.sicknessBenefitDays ?? 0) > 0) {
        absenceItems.push({
          label: intl.formatMessage({
            id: 'salary-sickness-benefit-days',
            defaultMessage: 'Sickness-benefit days',
          }),
          value: calculation.sicknessBenefitDays ?? 0,
          unit: '',
        });
      }
      if ((calculation.leavePayment ?? 0) > 0) {
        absenceItems.push({
          label: intl.formatMessage({
            id: 'salary-vacation',
            defaultMessage: 'Annual leave pay',
          }),
          value: formatNumber(calculation.leavePayment),
        });
      }
    }
    if (
      calculation.calculationType === 'mandate' &&
      (calculation.sicknessBenefit ?? 0) > 0
    ) {
      absenceItems.push(
        {
          label: intl.formatMessage({
            id: 'salary-sickness-benefit',
            defaultMessage: 'Sickness benefit',
          }),
          value: formatNumber(calculation.sicknessBenefit),
        },
        {
          label: intl.formatMessage({
            id: 'salary-sickness-benefit-days',
            defaultMessage: 'Sickness-benefit days',
          }),
          value: calculation.sicknessBenefitDays ?? 0,
          unit: '',
        },
      );
    }
    const salaryGroups: BreakdownGroup[] = [
      {
        title: intl.formatMessage({
          id: 'salary-details-base',
          defaultMessage: 'Base and employment',
        }),
        items: baseItems,
      },
    ];
    if (reductionItems.length > 0) {
      salaryGroups.push({
        title: intl.formatMessage({
          id: 'salary-details-reductions',
          defaultMessage: 'Reductions',
        }),
        items: reductionItems,
      });
    }
    if (additionalPayItems.length > 0) {
      salaryGroups.push({
        title: intl.formatMessage({
          id: 'salary-details-additional-pay',
          defaultMessage: 'Overtime and allowances',
        }),
        items: additionalPayItems,
      });
    }
    if (bonusItems.length > 0) {
      salaryGroups.push({
        title: intl.formatMessage({
          id: 'salary-details-bonuses',
          defaultMessage: 'Bonuses and benefits',
        }),
        items: bonusItems,
      });
    }
    if (absenceItems.length > 0) {
      salaryGroups.push({
        title: intl.formatMessage({
          id: 'salary-details-absence',
          defaultMessage: 'Sickness and leave',
        }),
        items: absenceItems,
      });
    }
    salaryGroups.push({
      title: intl.formatMessage({
        id: 'salary-details-gross-summary',
        defaultMessage: 'Gross summary',
      }),
      items: [
        {
          label: intl.formatMessage({
            id: 'salary-brutto-total',
            defaultMessage: 'Gross total',
          }),
          value: formatNumber(calculation.fullSalaryBrutto),
          emphasis: true,
        },
      ],
    });
    const pitItems: BreakdownItem[] = [];
    if (calculation.pitRevenue != null) {
      pitItems.push({
        label: intl.formatMessage({
          id: 'taxes-pit-revenue',
          defaultMessage: 'PIT revenue',
        }),
        value: formatNumber(calculation.pitRevenue),
      });
    }
    if ((calculation.pitExemptRevenue ?? 0) > 0) {
      pitItems.push({
        label: intl.formatMessage({
          id: 'taxes-pit0-exempt-revenue',
          defaultMessage: 'PIT-0 exempt revenue',
        }),
        value: formatNumber(calculation.pitExemptRevenue),
      });
    }
    if ((calculation.pitKup ?? 0) > 0) {
      pitItems.push({
        label: intl.formatMessage({
          id: 'taxes-kup-used',
          defaultMessage: 'Tax-deductible costs (KUP)',
        }),
        value: formatNumber(calculation.pitKup),
      });
    }
    pitItems.push({
      label: intl.formatMessage({
        id: 'taxes-pit-base',
        defaultMessage: 'PIT base',
      }),
      value: formatNumber(calculation.pitBase),
    });
    if ((calculation.pitAt12 ?? 0) > 0) {
      pitItems.push({
        label: intl.formatMessage({
          id: 'taxes-pit-at-12',
          defaultMessage: 'PIT calculated at 12%',
        }),
        value: formatNumber(calculation.pitAt12),
      });
    }
    if ((calculation.pitAt32 ?? 0) > 0) {
      pitItems.push({
        label: intl.formatMessage({
          id: 'taxes-pit-at-32',
          defaultMessage: 'PIT calculated at 32%',
        }),
        value: formatNumber(calculation.pitAt32),
      });
    }
    pitItems.push({
      label: intl.formatMessage({
        id: 'taxes-pit',
        defaultMessage: 'PIT advance',
      }),
      value: formatNumber(calculation.pitTax),
      negative: calculation.pitTax > 0,
      emphasis: true,
    });
    const socialItems: BreakdownItem[] = [];
    const healthItems: BreakdownItem[] = [];
    const showSocial =
      calculation.calculationType !== 'uod_fixed' ||
      (calculation.zusTaxes ?? 0) > 0;
    if (showSocial) {
      socialItems.push(
        {
          label: intl.formatMessage({
            id: 'taxes-social-base',
            defaultMessage: 'Social insurance base',
          }),
          value: formatNumber(calculation.socialInsuranceBase),
        },
        {
          label: intl.formatMessage({
            id: 'taxes-zus-pension',
            defaultMessage: 'Pension contribution',
          }),
          value: formatNumber(calculation.zusPension),
          negative: (calculation.zusPension ?? 0) > 0,
        },
        {
          label: intl.formatMessage({
            id: 'taxes-zus-disability',
            defaultMessage: 'Disability contribution',
          }),
          value: formatNumber(calculation.zusDisability),
          negative: (calculation.zusDisability ?? 0) > 0,
        },
        {
          label: intl.formatMessage({
            id: 'taxes-zus-sickness',
            defaultMessage: 'Sickness contribution',
          }),
          value: formatNumber(calculation.zusSickness),
          negative: (calculation.zusSickness ?? 0) > 0,
        },
        {
          label: intl.formatMessage({
            id: 'taxes-zus-total',
            defaultMessage: 'ZUS total',
          }),
          value: formatNumber(calculation.zusTaxes),
          negative: calculation.zusTaxes > 0,
          emphasis: true,
        },
      );
      healthItems.push(
        {
          label: intl.formatMessage({
            id: 'taxes-health-base',
            defaultMessage: 'Health contribution base',
          }),
          value: formatNumber(calculation.healthInsuranceBase),
        },
        {
          label: intl.formatMessage({
            id: 'taxes-health',
            defaultMessage: 'Health contribution',
          }),
          value: formatNumber(calculation.healthInsurance),
          negative: calculation.healthInsurance > 0,
          emphasis: true,
        },
      );
    }
    const taxGroups: BreakdownGroup[] = [
      {
        title: intl.formatMessage({
          id: 'taxes-pit-title',
          defaultMessage: 'PIT',
        }),
        items: pitItems,
      },
    ];
    if (healthItems.length > 0) {
      taxGroups.push({
        title: intl.formatMessage({
          id: 'taxes-health-title',
          defaultMessage: 'Health insurance (NFZ)',
        }),
        items: healthItems,
      });
    }
    if (socialItems.length > 0) {
      taxGroups.push({
        title: intl.formatMessage({
          id: 'taxes-social-title',
          defaultMessage: 'Social insurance (ZUS)',
        }),
        items: socialItems,
      });
    }
    const sections: BreakdownSection[] = [
      {
        title: intl.formatMessage({
          id: 'salary-title',
          defaultMessage: 'Salary',
        }),
        groups: salaryGroups,
      },
      {
        title: intl.formatMessage({
          id: 'taxes-title',
          defaultMessage: 'Taxes and contributions',
        }),
        groups: taxGroups,
      },
    ];
    if (
      (calculation.ppkBase ?? 0) > 0 ||
      (calculation.ppkEmployee ?? 0) > 0 ||
      (calculation.ppkEmployer ?? 0) > 0
    ) {
      sections.push({
        title: intl.formatMessage({
          id: 'taxes-ppk-title',
          defaultMessage: 'PPK',
        }),
        groups: [
          {
            items: [
              {
                label: intl.formatMessage({
                  id: 'taxes-ppk-base',
                  defaultMessage: 'PPK base',
                }),
                value: formatNumber(calculation.ppkBase),
              },
              {
                label: intl.formatMessage({
                  id: 'taxes-ppk-employee',
                  defaultMessage: 'Employee PPK',
                }),
                value: formatNumber(calculation.ppkEmployee),
                negative: (calculation.ppkEmployee ?? 0) > 0,
              },
              {
                label: intl.formatMessage({
                  id: 'taxes-ppk-employer',
                  defaultMessage: 'Employer PPK',
                }),
                value: formatNumber(calculation.ppkEmployer),
              },
            ],
          },
        ],
      });
    }
    if (calculation.yearToDate) {
      sections.push({
        title: intl.formatMessage({
          id: 'taxes-ytd-title',
          defaultMessage: 'Year-to-date limits',
        }),
        groups: [
          {
            items: [
              {
                label: intl.formatMessage({
                  id: 'taxes-ytd-taxable-income',
                  defaultMessage: 'YTD taxable income',
                }),
                value: formatNumber(calculation.yearToDate.taxableIncome),
              },
              {
                label: intl.formatMessage({
                  id: 'taxes-ytd-pit0-revenue',
                  defaultMessage: 'YTD PIT-0 revenue',
                }),
                value: formatNumber(calculation.yearToDate.pit0Revenue),
              },
              {
                label: intl.formatMessage({
                  id: 'taxes-ytd-zus-base',
                  defaultMessage: 'YTD pension/disability base',
                }),
                value: formatNumber(calculation.yearToDate.pensionDisabilityBase),
              },
              {
                label: intl.formatMessage({
                  id: 'taxes-ytd-50-kup',
                  defaultMessage: 'YTD 50% KUP used',
                }),
                value: formatNumber(calculation.yearToDate.copyrightKupUsed),
              },
              {
                label: intl.formatMessage({
                  id: 'taxes-ytd-uop-kup',
                  defaultMessage: 'YTD UoP KUP used',
                }),
                value: formatNumber(calculation.yearToDate.uopKupUsed),
              },
              {
                label: intl.formatMessage({
                  id: 'taxes-ytd-sick-pay-days',
                  defaultMessage: 'YTD employer sick-pay days',
                }),
                value: calculation.yearToDate.employerSickPayDays,
                unit: '',
              },
            ],
          },
        ],
      });
    }
    return sections;
  }, [calculation, intl, nonCashBonusTotal]);
  const summaryItems = useMemo<SummaryItem[]>(
    () => [
      {
        label: intl.formatMessage({
          id: 'salary-brutto-total',
          defaultMessage: 'Gross total',
        }),
        value: formatNumber(calculation.fullSalaryBrutto),
      },
      {
        label: intl.formatMessage({
          id: 'taxes-zus-total',
          defaultMessage: 'ZUS total',
        }),
        value: formatNumber(calculation.zusTaxes),
        negative: (calculation.zusTaxes ?? 0) > 0,
      },
      {
        label: intl.formatMessage({
          id: 'taxes-health',
          defaultMessage: 'Health contribution',
        }),
        value: formatNumber(calculation.healthInsurance),
        negative: (calculation.healthInsurance ?? 0) > 0,
      },
      {
        label: intl.formatMessage({
          id: 'taxes-pit',
          defaultMessage: 'PIT advance',
        }),
        value: formatNumber(calculation.pitTax),
        negative: (calculation.pitTax ?? 0) > 0,
      },
      ...((calculation.ppkEmployee ?? 0) > 0
        ? [
            {
              label: intl.formatMessage({
                id: 'taxes-ppk-employee',
                defaultMessage: 'Employee PPK',
              }),
              value: formatNumber(calculation.ppkEmployee),
              negative: true,
            },
          ]
        : []),
      {
        label: intl.formatMessage({
          id: 'taxes-netto',
          defaultMessage: 'Net salary',
        }),
        value: formatNumber(calculation.netto),
        net: true,
      },
    ],
    [calculation, intl],
  );
  return (
    <Box
      display="flex"
      gap={5}
      alignItems="center"
      sx={{ flexDirection: { xs: 'column' } }}
    >
      <Box maxWidth={300} p={2}>
        <Doughnut
          data={
            calculation.fullSalaryBrutto === 0
              ? withNoData
              : data
          }
          options={options}
          plugins={[centerTextPlugin]}
          ref={chartRef}
        />
      </Box>
      <Box>
        {labels.map((label, index) => {
          const value = taxData[index];
          const percent = total ? ((value / total) * 100).toFixed(1) : '0.0';
          const color = colors[index];
          return (
            <Box
              key={label}
              display="flex"
              alignItems="center"
              mb={1}
              gap={1}
            >
              <Box
                component="div"
                minWidth={18}
                minHeight={18}
                bgcolor={color}
                borderRadius="4px"
                sx={{
                  cursor: 'pointer',
                  transform: 'scale(1.1)',
                  transition: 'all 0.2s ease-in',
                }}
                onMouseEnter={() => {
                  const chart = chartRef.current;
                  if (!chart) return;
                  chart.setActiveElements([{ datasetIndex: 0, index }]);
                  // @ts-ignore chart.js custom transition name
                  chart.update('fast');
                }}
                onMouseLeave={() => {
                  const chart = chartRef.current;
                  if (!chart) return;
                  chart.setActiveElements([]);
                  // @ts-ignore chart.js custom transition name
                  chart.update('fast');
                }}
              />
              <Typography
                fontFamily="Poppins"
                fontSize={16}
                color="#0a1936"
                fontWeight={500}
              >
                {label}: {formatNumber(value)} zł ({percent}%)
              </Typography>
            </Box>
          );
        })}
        <Button
          variant="text"
          sx={{
            display: 'flex',
            gap: 1,
            p: 0,
            mt: 1,
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'transparent',
              color: '#1287f5',
            },
          }}
          onClick={() => setOpen(true)}
        >
          <InfoCircleOutlined style={{ fontSize: 22 }} />
          <Typography>
            {intl.formatMessage({ id: 'details', defaultMessage: 'Szczegóły' })}
          </Typography>
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          aria-labelledby="salary-calculation-details"
        >
          <Box
            sx={{
              borderRadius: { xs: 1.5, sm: 4 },
              bgcolor: 'white',
              p: { xs: 1, sm: 2 },
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '85%' },
              maxWidth: 980,
              maxHeight: '80vh',
              fontFamily: 'Poppins',
            }}
          >
            <Box
              sx={{
                overflowY: 'auto',
                maxHeight: '75vh',
                p: 2,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': {
                  background: '#475488',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#23326D',
                },
              }}
            >
              <Box mb={3}>
                <Typography
                  id="salary-calculation-details"
                  variant="h5"
                  color="#0A1936"
                  fontWeight={700}
                  sx={{ fontSize: { xs: 20, sm: 26 } }}
                  mb={0.5}
                >
                  {intl.formatMessage({
                    id: 'tax-chart-details-title',
                    defaultMessage: 'Calculation details',
                  })}
                </Typography>
                <Typography
                  color="#667085"
                  sx={{ fontSize: { xs: 13, sm: 14.5 } }}
                >
                  {intl.formatMessage({
                    id: 'tax-chart-details-description',
                    defaultMessage:
                      'See how gross remuneration is divided into contributions, tax and the final net amount.',
                  })}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 1.25,
                  mb: 3.5,
                }}
              >
                {summaryItems.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      border: '1px solid',
                      borderColor: item.net ? '#C9D4F2' : '#E4E8F0',
                      borderRadius: 2,
                      bgcolor: item.net ? '#F0F4FF' : '#FAFBFD',
                      px: { xs: 1.25, sm: 1.75 },
                      py: { xs: 1.25, sm: 1.5 },
                    }}
                  >
                    <Typography
                      color="#667085"
                      sx={{ fontSize: { xs: 11.5, sm: 13 }, lineHeight: 1.35 }}
                      mb={0.5}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      fontWeight={item.net ? 700 : 600}
                      color={
                        item.net
                          ? '#23326D'
                          : item.negative
                            ? 'error.main'
                            : '#272836'
                      }
                      sx={{ fontSize: { xs: 14.5, sm: 17 } }}
                    >
                      {item.negative ? '-' : ''}{item.value} PLN
                    </Typography>
                  </Box>
                ))}
              </Box>
              {(calculation.warnings?.length ?? 0) > 0 && (
                <Stack spacing={1} mb={3}>
                  {calculation.warnings?.map((warning, index) => (
                    <Alert severity="warning" key={`${warning.id}-${index}`}>
                      {intl.formatMessage(
                        { id: warning.id },
                        warning.values,
                      )}
                    </Alert>
                  ))}
                </Stack>
              )}
              {nonCashBonusTotal > 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  {intl.formatMessage(
                    {
                      id: 'tax-chart-non-cash-info',
                      defaultMessage:
                        'Non-cash benefits worth {amount} PLN are included in gross remuneration and payroll calculations, but their value is not transferred to your bank account with the salary payment. They are provided separately, for example as a benefit or credit in an employee benefits platform.',
                    },
                    {
                      amount: formatNumber(nonCashBonusTotal),
                    },
                  )}
                </Alert>
              )}
              {breakdownConfig.map((section) => (
                <Box key={section.title} mb={4}>
                  <Typography
                    variant="h6"
                    color="#23326D"
                    sx={{
                      fontSize: { xs: 17.5, sm: 21 },
                      pb: 1,
                      borderBottom: '2px solid #E8ECF5',
                    }}
                    fontWeight={700}
                    mb={2}
                  >
                    {section.title}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                      gap: 2,
                    }}
                  >
                    {section.groups.map((group, groupIndex) => (
                      <Box
                        key={`${section.title}-${group.title ?? groupIndex}`}
                        sx={{
                          border: '1px solid #E4E8F0',
                          borderRadius: 2.5,
                          bgcolor: '#FFFFFF',
                          overflow: 'hidden',
                          alignSelf: 'start',
                        }}
                      >
                        {group.title && (
                          <Box
                            sx={{
                              bgcolor: '#F6F8FC',
                              borderBottom: '1px solid #E4E8F0',
                              px: { xs: 1.5, sm: 2 },
                              py: 1.15,
                            }}
                          >
                            <Typography
                              color="#33436F"
                              fontWeight={600}
                              sx={{ fontSize: { xs: 14, sm: 15.5 } }}
                            >
                              {group.title}
                            </Typography>
                          </Box>
                        )}
                        <Box px={{ xs: 1.5, sm: 2 }}>
                          {group.items.map((item, itemIndex) => (
                            <Box
                              key={`${item.label}-${itemIndex}`}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) auto',
                                alignItems: 'center',
                                gap: 2,
                                py: 1.15,
                                borderBottom:
                                  itemIndex === group.items.length - 1
                                    ? 'none'
                                    : '1px solid #EEF0F4',
                                bgcolor: item.emphasis ? '#FAFBFD' : 'transparent',
                                mx: item.emphasis
                                  ? { xs: -1.5, sm: -2 }
                                  : 0,
                                px: item.emphasis
                                  ? { xs: 1.5, sm: 2 }
                                  : 0,
                              }}
                            >
                              <Typography
                                color={item.emphasis ? '#1D2939' : '#475467'}
                                fontWeight={item.emphasis ? 600 : 400}
                                sx={{
                                  fontSize: { xs: 13.5, sm: 15 },
                                  minWidth: 0,
                                }}
                              >
                                {item.label}
                              </Typography>
                              <Typography
                                fontWeight={item.emphasis ? 700 : 600}
                                color={item.negative ? 'error.main' : '#272836'}
                                textAlign="right"
                                sx={{
                                  fontSize: { xs: 13.5, sm: 15 },
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.negative ? '-' : ''}
                                {item.value}
                                {item.unit === '' ? '' : ` ${item.unit ?? 'PLN'}`}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
});
