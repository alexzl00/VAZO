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
};

type BreakdownSection = {
  title: string;
  items: BreakdownItem[];
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
      (calculation.otherBonus ?? 0) +
      (calculation.attendanceBonus ?? 0) +
      (calculation.discretionaryBonus ?? 0);

    const baseSalary =
      calculation.calculationType === 'uop'
        ? calculation.workDaysPayment ?? 0
        : calculation.calculationType === 'mandate'
          ? Math.max(0, calculation.fullSalaryBrutto - bonusTotal - (calculation.sicknessBenefit ?? 0))
          : calculation.rate ?? 0;

    const salaryItems: BreakdownItem[] = [
      {
        label: intl.formatMessage({
          id: 'salary-monthly-brutto',
          defaultMessage: 'Base remuneration',
        }),
        value: formatNumber(baseSalary),
      },
      {
        label: intl.formatMessage({
          id: 'salary-bonuses-brutto',
          defaultMessage: 'Bonuses',
        }),
        value: formatNumber(bonusTotal),
      },
    ];

    if (
      calculation.calculationType === 'mandate' &&
      (calculation.sicknessBenefit ?? 0) > 0
    ) {
      salaryItems.push(
        {
          label: intl.formatMessage({ id: 'salary-sickness-benefit', defaultMessage: 'Sickness benefit' }),
          value: formatNumber(calculation.sicknessBenefit),
        },
        {
          label: intl.formatMessage({ id: 'salary-sickness-benefit-days', defaultMessage: 'Sickness-benefit days' }),
          value: calculation.sicknessBenefitDays ?? 0,
          unit: '',
        },
      );
    }

    if (calculation.calculationType === 'uop') {
      salaryItems.push(
        {
          label: intl.formatMessage({ id: 'salary-hourly-rate', defaultMessage: 'Hourly rate' }),
          value: formatNumber(calculation.perHour),
        },
        {
          label: intl.formatMessage({ id: 'salary-daily-overtimes', defaultMessage: 'Overtime +50%' }),
          value: formatNumber(calculation.dailyOvertimes),
        },
        {
          label: intl.formatMessage({ id: 'salary-weekend-holiday-overtimes', defaultMessage: 'Overtime +100%' }),
          value: formatNumber(calculation.weekendHolidayOvertimes),
        },
        {
          label: intl.formatMessage({ id: 'salary-night-overtimes', defaultMessage: 'Night overtime' }),
          value: formatNumber(calculation.nightOvertime),
        },
        {
          label: intl.formatMessage({ id: 'salary-night-hours', defaultMessage: 'Night-work allowance' }),
          value: formatNumber(calculation.nightWorkAllowance ?? calculation.nightHours),
        },
        {
          label: intl.formatMessage({ id: 'salary-turn-of-day-hours', defaultMessage: 'Turn-of-day allowance' }),
          value: formatNumber(calculation.turnOfDayHours),
        },
        {
          label: intl.formatMessage({ id: 'salary-sick-pay-employer', defaultMessage: 'Employer sick pay' }),
          value: formatNumber(calculation.employerSickPay),
        },
        {
          label: intl.formatMessage({ id: 'salary-sickness-benefit', defaultMessage: 'Sickness benefit' }),
          value: formatNumber(calculation.sicknessBenefit),
        },
        {
          label: intl.formatMessage({ id: 'salary-sick-pay-days', defaultMessage: 'Employer sick-pay days' }),
          value: calculation.employerSickPayDays ?? 0,
          unit: '',
        },
        {
          label: intl.formatMessage({ id: 'salary-sickness-benefit-days', defaultMessage: 'Sickness-benefit days' }),
          value: calculation.sicknessBenefitDays ?? 0,
          unit: '',
        },
        {
          label: intl.formatMessage({ id: 'salary-vacation', defaultMessage: 'Annual leave pay' }),
          value: formatNumber(calculation.leavePayment),
        },
      );
    }

    salaryItems.push({
      label: intl.formatMessage({ id: 'salary-brutto-total', defaultMessage: 'Gross total' }),
      value: formatNumber(calculation.fullSalaryBrutto),
    });

    const taxesItems: BreakdownItem[] = [];

    if (calculation.pitRevenue != null) {
      taxesItems.push({
        label: intl.formatMessage({ id: 'taxes-pit-revenue', defaultMessage: 'PIT revenue' }),
        value: formatNumber(calculation.pitRevenue),
      });
    }

    if ((calculation.pitExemptRevenue ?? 0) > 0) {
      taxesItems.push({
        label: intl.formatMessage({ id: 'taxes-pit0-exempt-revenue', defaultMessage: 'PIT-0 exempt revenue' }),
        value: formatNumber(calculation.pitExemptRevenue),
      });
    }

    if ((calculation.pitKup ?? 0) > 0) {
      taxesItems.push({
        label: intl.formatMessage({ id: 'taxes-kup-used', defaultMessage: 'Tax-deductible costs (KUP)' }),
        value: formatNumber(calculation.pitKup),
      });
    }

    taxesItems.push(
      {
        label: intl.formatMessage({ id: 'taxes-pit-base', defaultMessage: 'PIT base' }),
        value: formatNumber(calculation.pitBase),
      },
    );

    if ((calculation.pitAt12 ?? 0) > 0) {
      taxesItems.push({
        label: intl.formatMessage({ id: 'taxes-pit-at-12', defaultMessage: 'PIT calculated at 12%' }),
        value: formatNumber(calculation.pitAt12),
      });
    }

    if ((calculation.pitAt32 ?? 0) > 0) {
      taxesItems.push({
        label: intl.formatMessage({ id: 'taxes-pit-at-32', defaultMessage: 'PIT calculated at 32%' }),
        value: formatNumber(calculation.pitAt32),
      });
    }

    taxesItems.push({
      label: intl.formatMessage({ id: 'taxes-pit', defaultMessage: 'PIT advance' }),
      value: formatNumber(calculation.pitTax),
      negative: calculation.pitTax > 0,
    });

    const showSocial =
      calculation.calculationType !== 'uod_fixed' ||
      (calculation.zusTaxes ?? 0) > 0;

    if (showSocial) {
      taxesItems.push(
        {
          label: intl.formatMessage({ id: 'taxes-social-base', defaultMessage: 'Social insurance base' }),
          value: formatNumber(calculation.socialInsuranceBase),
        },
        {
          label: intl.formatMessage({ id: 'taxes-zus-pension', defaultMessage: 'Pension contribution' }),
          value: formatNumber(calculation.zusPension),
          negative: (calculation.zusPension ?? 0) > 0,
        },
        {
          label: intl.formatMessage({ id: 'taxes-zus-disability', defaultMessage: 'Disability contribution' }),
          value: formatNumber(calculation.zusDisability),
          negative: (calculation.zusDisability ?? 0) > 0,
        },
        {
          label: intl.formatMessage({ id: 'taxes-zus-sickness', defaultMessage: 'Sickness contribution' }),
          value: formatNumber(calculation.zusSickness),
          negative: (calculation.zusSickness ?? 0) > 0,
        },
        {
          label: intl.formatMessage({ id: 'taxes-zus-total', defaultMessage: 'ZUS total' }),
          value: formatNumber(calculation.zusTaxes),
          negative: calculation.zusTaxes > 0,
        },
        {
          label: intl.formatMessage({ id: 'taxes-health-base', defaultMessage: 'Health contribution base' }),
          value: formatNumber(calculation.healthInsuranceBase),
        },
        {
          label: intl.formatMessage({ id: 'taxes-health', defaultMessage: 'Health contribution' }),
          value: formatNumber(calculation.healthInsurance),
          negative: calculation.healthInsurance > 0,
        },
      );
    }

    const ppkItems: BreakdownItem[] = [];
    if ((calculation.ppkBase ?? 0) > 0 || (calculation.ppkEmployee ?? 0) > 0 || (calculation.ppkEmployer ?? 0) > 0) {
      ppkItems.push(
        {
          label: intl.formatMessage({ id: 'taxes-ppk-base', defaultMessage: 'PPK base' }),
          value: formatNumber(calculation.ppkBase),
        },
        {
          label: intl.formatMessage({ id: 'taxes-ppk-employee', defaultMessage: 'Employee PPK' }),
          value: formatNumber(calculation.ppkEmployee),
          negative: (calculation.ppkEmployee ?? 0) > 0,
        },
        {
          label: intl.formatMessage({ id: 'taxes-ppk-employer', defaultMessage: 'Employer PPK' }),
          value: formatNumber(calculation.ppkEmployer),
        },
      );
    }

    const ytdItems: BreakdownItem[] = calculation.yearToDate
      ? [
          {
            label: intl.formatMessage({ id: 'taxes-ytd-taxable-income', defaultMessage: 'YTD taxable income' }),
            value: formatNumber(calculation.yearToDate.taxableIncome),
          },
          {
            label: intl.formatMessage({ id: 'taxes-ytd-pit0-revenue', defaultMessage: 'YTD PIT-0 revenue' }),
            value: formatNumber(calculation.yearToDate.pit0Revenue),
          },
          {
            label: intl.formatMessage({ id: 'taxes-ytd-zus-base', defaultMessage: 'YTD pension/disability base' }),
            value: formatNumber(calculation.yearToDate.pensionDisabilityBase),
          },
          {
            label: intl.formatMessage({ id: 'taxes-ytd-50-kup', defaultMessage: 'YTD 50% KUP used' }),
            value: formatNumber(calculation.yearToDate.copyrightKupUsed),
          },
          {
            label: intl.formatMessage({ id: 'taxes-ytd-uop-kup', defaultMessage: 'YTD UoP KUP used' }),
            value: formatNumber(calculation.yearToDate.uopKupUsed),
          },
          {
            label: intl.formatMessage({ id: 'taxes-ytd-sick-pay-days', defaultMessage: 'YTD employer sick-pay days' }),
            value: calculation.yearToDate.employerSickPayDays,
            unit: '',
          },
        ]
      : [];

    const sections: BreakdownSection[] = [
      {
        title: intl.formatMessage({ id: 'salary-title', defaultMessage: 'Salary' }),
        items: salaryItems,
      },
      {
        title: intl.formatMessage({ id: 'taxes-title', defaultMessage: 'Taxes and contributions' }),
        items: taxesItems,
      },
    ];

    if (ppkItems.length > 0) {
      sections.push({
        title: intl.formatMessage({ id: 'taxes-ppk-title', defaultMessage: 'PPK' }),
        items: ppkItems,
      });
    }

    if (ytdItems.length > 0) {
      sections.push({
        title: intl.formatMessage({ id: 'taxes-ytd-title', defaultMessage: 'Year-to-date limits' }),
        items: ytdItems,
      });
    }

    sections.push({
      title: intl.formatMessage({ id: 'taxes-calculation-summary', defaultMessage: 'Summary' }),
      items: [
        {
          label: intl.formatMessage({ id: 'taxes-netto', defaultMessage: 'Net salary' }),
          value: formatNumber(calculation.netto),
        },
      ],
    });

    return sections;
  }, [calculation, intl]);

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
              maxWidth: 850,
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
              {(calculation.warnings?.length ?? 0) > 0 && (
                <Stack spacing={1} mb={3}>
                  {calculation.warnings?.map((warning, index) => (
                    <Alert severity="warning" key={`${warning}-${index}`}>
                      {warning}
                    </Alert>
                  ))}
                </Stack>
              )}

              {breakdownConfig.map((section) => (
                <Box key={section.title} mb={4}>
                  <Typography
                    variant="h6"
                    color="#23326D"
                    sx={{ fontSize: { xs: 17.5, sm: 22 } }}
                    fontWeight={600}
                    mb={2}
                  >
                    {section.title}
                  </Typography>

                  {section.items.map((item) => (
                    <Box
                      key={item.label}
                      display="flex"
                      justifyContent="space-between"
                      gap={2}
                      py={1}
                      borderBottom="1px solid #e2e2e2"
                    >
                      <Typography
                        sx={{ fontSize: { xs: 14, sm: 16, md: 17.5 } }}
                        color="#272836"
                      >
                        {item.label}
                      </Typography>

                      <Typography
                        fontWeight={500}
                        color={item.negative ? 'error.main' : 'text.primary'}
                        textAlign="right"
                        sx={{ fontSize: { xs: 14, sm: 16, md: 17.5 } }}
                      >
                        {item.negative ? '-' : ''}{item.value}{item.unit === '' ? '' : ` ${item.unit ?? 'PLN'}`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
});

