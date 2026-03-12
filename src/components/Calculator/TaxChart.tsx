import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Collapse, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Modal, Typography } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, type ChartOptions, type Plugin } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import type { Chart as ChartJSInstance } from 'chart.js';
import { StarBorder } from '@mui/icons-material';
import { calculateTaxes, type SalaryCalculationResult } from '../../pages/SalaryCalculator';
import { InfoCircleOutlined } from "@ant-design/icons";

import React from 'react';
import { useIntl } from 'react-intl';

ChartJS.register(ArcElement, Tooltip);


type TaxChartProps = {
    calculation: SalaryCalculationResult
}

type BreakdownItem = {
  label: string;
  value: number | string;
  negative?: boolean;
};

type BreakdownSection = {
  title: string;
  items: BreakdownItem[];
};

export default React.memo(function TaxChart({calculation} : TaxChartProps) {
    const chartRef = useRef<ChartJSInstance<'doughnut'> | null>(null);
    const bruttoRef = useRef(calculation.fullSalaryBrutto);
    const nettoRef = useRef(calculation.netto);

    const [open, setOpen] = useState<boolean>(false);

    const intl = useIntl();

    // console.log(errors);

    const labels = useMemo(() => [
        'PIT',
        'ZUS',
        'NFZ',
        'NETTO'
    ], []);
    // console.log(calculation)

    useEffect(() => {
        bruttoRef.current = calculation.fullSalaryBrutto;
        nettoRef.current = calculation.netto;

        chartRef.current?.update();
    }, [calculation.fullSalaryBrutto, calculation.netto]) // VERNUTSYA SUDA

    const taxData = useMemo(() => [
        calculation.fullSalaryBrutto === 0 ? 0 : calculation.pitTax ?? 0,
        calculation.fullSalaryBrutto === 0 ? 0 : calculation.zusTaxes ?? 0,
        calculation.fullSalaryBrutto === 0 ? 0 : calculation.healthInsurance ?? 0,
        calculation.fullSalaryBrutto === 0 ? 0 : calculation.netto ?? 0,
        ], [calculation.pitTax,
    calculation.zusTaxes,
    calculation.healthInsurance,
    calculation.netto,
    calculation.fullSalaryBrutto]);

    // console.log(calculation.netto)

    const total = useMemo(
        () => taxData.reduce((a, b) => a + b, 0),
        [taxData]
    );

    const colors = useMemo(() => [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
    ], []);

    const bruttoPension = useMemo<Plugin<'doughnut'>>(() => ({
        id: 'centerText',
        afterDatasetsDraw: (chart) => {
            const { ctx, chartArea } = chart;

            ctx.save();
            ctx.font = '500 20px Poppins';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0a1936';

            const brutto = bruttoRef.current;
            const netto = nettoRef.current;

            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.bottom + chartArea.top) / 2;


            
            ctx.fillText(
                `${netto.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                })} PLN`,
                centerX,
                centerY
            );

            ctx.fillText(
                'netto',
                centerX,
                centerY + 25
            );

            ctx.font = '500 14px Poppins';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#636363';
            ctx.fillText(
                `BR. ${brutto.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                })} PLN`,
                centerX,
                centerY + 50
            );
            ctx.restore();
        },
    }), [calculation.fullSalaryBrutto, calculation.netto]);

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
        [taxData, colors]
    );

    const withNoData = {
        labels :['Brak danych'],
        datasets: [
            {
                data: [1],
                backgroundColor: "#9e9e9e",
                borderColor: 'rgba(0,0,0,0)',
                hoverBorderColor: "#9e9e9e",
                radius: '95%',
                hoverOffset: 10,
            },
            ],
    }

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
                        label: (context) => {
                        const value = context.parsed;
                        if (!total) return '0%';

                        const percent = ((value / total) * 100).toFixed(1);
                        return `${percent}%`;
                        },
                    },
                    },
                },
            }),
        [total]
    );

    const breakdownConfig = useMemo(() => {
        const formatNumber = (value: number | undefined, min = 1, max = 2) =>
            value != null
            ? value.toLocaleString(undefined, { minimumFractionDigits: min, maximumFractionDigits: max })
            : '0,00';

        const getSalaryItems = (calculation: any, intl: any) => {
            const items: BreakdownItem[] = [
            { label: intl.formatMessage({ id: 'salary-monthly-brutto' }), 
                value: calculation.calculationType === 'employment'
                ? formatNumber(calculation.workDaysPayment)
                : formatNumber(calculation.rate)
            },
            { label: intl.formatMessage({ id: 'salary-bonuses-brutto' }),
                value: formatNumber(
                    (parseFloat(calculation.otherBonus) || 0) +
                    (parseFloat(calculation.attendanceBonus) || 0) +
                    (parseFloat(calculation.discretionaryBonus) || 0)
                )
            },
            ];

            if (calculation.calculationType === 'employment') {
                items.push(
                    { label: intl.formatMessage({ id: 'salary-hourly-rate' }), 
                        value: formatNumber(calculation.perHour)
                    },
                    { label: intl.formatMessage({ id: 'salary-daily-overtimes' }), value: formatNumber(calculation.dailyOvertimes) },
                    { label: intl.formatMessage({ id: 'salary-weekend-holiday-overtimes' }), value: formatNumber(calculation.weekendHolidayOvertimes) },
                    { label: intl.formatMessage({ id: 'salary-night-overtimes' }), value: formatNumber(calculation.nightOvertime) },
                    { label: intl.formatMessage({ id: 'salary-night-hours' }), value: formatNumber(calculation.nightHours) },
                    { label: intl.formatMessage({ id: 'salary-turn-of-day-hours' }), value: formatNumber(calculation.turnOfDayHours) },
                    { label: intl.formatMessage({ id: 'salary-l4' }), value: formatNumber(calculation.l4Payment) },
                    { label: intl.formatMessage({ id: 'salary-vacation' }), value: 0 },
                );
            }

            items.push({ label: intl.formatMessage({ id: 'salary-brutto-total' }), value: formatNumber(calculation.fullSalaryBrutto) });

            return {
                title: intl.formatMessage({ id: 'salary-title' }),
                items,
            };
        };

        const getTaxesItems = (calculation: any, intl: any) => {
            const items: BreakdownItem[] = [];

            // Checking on PIT
            if (calculation.calculationType === 'contractOfMandate') {
                if (calculation.isUnder26 === false) {
                    items.push(
                        {
                            label: intl.formatMessage({ id: 'taxes-pit-base' }),
                            value: formatNumber(calculation.pitBase),
                            negative: calculation.pitBase > 0
                        },
                        {
                            label: intl.formatMessage({ id: 'taxes-pit' }),
                            value: formatNumber(calculation.pitTax),
                            negative: calculation.pitTax > 0
                        }
                    );
                }

                // Checking ZUS
                const skipZUS = calculation.isStudent && calculation.isUnder26;

                if (!skipZUS) {
                    items.push(
                        {
                            label: intl.formatMessage({ id: 'taxes-zus-pension' }),
                            value: formatNumber(calculation.zusPension),
                            negative: calculation.zusPension > 0
                        },
                        {
                            label: intl.formatMessage({ id: 'taxes-zus-disability' }),
                            value: formatNumber(calculation.zusDisability),
                            negative: calculation.zusDisability > 0
                        },
                        {
                            label: intl.formatMessage({ id: 'taxes-zus-sickness' }),
                            value: formatNumber(calculation.zusSickness),
                            negative: calculation.zusSickness > 0
                        },
                        {
                            label: intl.formatMessage({ id: 'taxes-zus-total' }),
                            value: formatNumber(calculation.zusTaxes),
                            negative: calculation.zusTaxes > 0
                        },
                        {
                            label: intl.formatMessage({ id: 'taxes-health-base' }),
                            value: formatNumber(calculation.healthInsuranceBase),
                        },
                        {
                            label: intl.formatMessage({ id: 'taxes-health' }),
                            value: formatNumber(calculation.healthInsurance),
                            negative: calculation.healthInsurance > 0
                        }
                    );
                }
            } else if (calculation.calculationType === 'employment') {
                if (calculation.forYoungPeople === false) {
                   items.push(
                        {
                            label: intl.formatMessage({ id: 'taxes-pit-base' }),
                            value: formatNumber(calculation.pitBase),
                            negative: calculation.pitBase > 0
                        },
                        {
                            label: intl.formatMessage({ id: 'taxes-pit' }),
                            value: formatNumber(calculation.pitTax),
                            negative: calculation.pitTax > 0
                        }
                    );
                }
                items.push(
                    {
                        label: intl.formatMessage({ id: 'taxes-zus-pension' }),
                        value: formatNumber(calculation.zusPension),
                        negative: calculation.zusPension > 0
                    },
                    {
                        label: intl.formatMessage({ id: 'taxes-zus-disability' }),
                        value: formatNumber(calculation.zusDisability),
                        negative: calculation.zusDisability > 0
                    },
                    {
                        label: intl.formatMessage({ id: 'taxes-zus-sickness' }),
                        value: formatNumber(calculation.zusSickness),
                        negative: calculation.zusSickness > 0
                    },
                    {
                        label: intl.formatMessage({ id: 'taxes-zus-total' }),
                        value: formatNumber(calculation.zusTaxes),
                        negative: calculation.zusTaxes > 0
                    },
                    {
                        label: intl.formatMessage({ id: 'taxes-health-base' }),
                        value: formatNumber(calculation.healthInsuranceBase),
                    },
                    {
                        label: intl.formatMessage({ id: 'taxes-health' }),
                        value: formatNumber(calculation.healthInsurance),
                        negative: calculation.healthInsurance > 0
                    }
                );
            }

            return {
                title: intl.formatMessage({ id: 'taxes-title' }),
                items,
            };
        };

        const getSummary = (calculation : any, intl: any) => {
            const items: BreakdownItem[] = [];
            items.push(
                { label: intl.formatMessage({ id: 'taxes-deduction-after-tax' }), value: formatNumber(calculation.deductionAfterTax) },
                { label: intl.formatMessage({ id: 'taxes-netto' }), value: formatNumber(calculation.netto) },
            );

            return {
                title: intl.formatMessage({ id: 'calculation-summary' }),
                items,
            };
        }

        return [getSalaryItems(calculation, intl), getTaxesItems(calculation, intl), getSummary(calculation, intl)];
        }, [calculation, intl]);

        
    return (
        <Box display="flex" gap={5} alignItems="center" sx={{
            flexDirection: {xs: 'column'}
        }}>
            {/* CHART */}
            <Box maxWidth={300} p={2}>
                <Doughnut 
                    data={calculation.fullSalaryBrutto === 0 || calculation.netto === 0  ? withNoData : data} 
                    options={options} 
                    plugins={[bruttoPension]}
                    ref={chartRef} 
                />
            </Box>

            {/* LEGEND */}
            <Box>
                {labels.map((label, index) => {
                    const value = taxData[index];
                    // console.log(value);
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
                                component={'div'}
                                minWidth={18}
                                minHeight={18}
                                bgcolor={color}
                                borderRadius="4px"
                                sx={{
                                    cursor: 'pointer',
                                    transform: 'scale(1.1)',
                                    transition: 'all 0.2s ease-in'
                                }}
                                onMouseEnter={() => {
                                    const chart = chartRef.current;
                                    if (!chart) return;

                                    chart.setActiveElements([
                                        { datasetIndex: 0, index: index },
                                    ]);
                                    
                                    // @ts-ignore
                                    chart.update('fast');
                                }}

                                onMouseLeave={() => {
                                    const chart = chartRef.current;
                                    if (!chart) return;

                                    chart.setActiveElements([]);

                                    // @ts-ignore
                                    chart.update('fast');
                                }}
                            >
                            </Box>
                            <Typography fontFamily="Poppins" fontSize={16} color='#0a1936' fontWeight={500}>
                                {label}: {value.toFixed(1).toLocaleString()} zł ({percent}%)
                            </Typography>
                        </Box>
                    );
                })}
                {/* INTL */}
                <Box>
                    <Button variant='text' sx={{
                        display: 'flex',
                        gap: 1,
                        p: 0,
                        textTransform: 'none',
                        "&:hover" : {
                            bgcolor: 'transparent',
                            color: '#1287f5',
                        }
                        
                    }} onClick={() => setOpen((prev) => prev = true)}>
                        <InfoCircleOutlined style={{ fontSize: 22 }} />
                        <Typography>
                            Szczegóły
                        </Typography>
                    </Button>
                    <Modal
                        open={open}
                        onClose={() => setOpen((prev) => prev = false)}
                        aria-labelledby="modal-modal-title"
                        aria-describedby="modal-modal-description"
                        >
                        <Box sx={{
                            borderRadius: {
                                xs: 1.5,
                                sm: 4
                            },
                            borderTopRightRadius: {
                                xs: 0,
                                sm: 0
                                },
                            borderBottomRightRadius: {
                                xs: 0,
                                sm: 0
                            },
                            bgcolor: 'white',
                            p: {
                                xs: 1,
                                sm: 2,
                                lg: 2,
                            },
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: {
                                xs: "90%",
                                sm: "85%",
                            },
                            maxWidth: 850,
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            fontFamily: 'Poppins',

                            "&::-webkit-scrollbar": {
                                width: "6px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                                background: "#475488",
                                borderRadius: "10px",
                                maxHeight: "40px"
                            },
                            "&::-webkit-scrollbar-thumb:hover": {
                                transition: 'all 0.2s ease',
                                background: "#23326D"
                            }
                        }}>
                            <Box>
                                {breakdownConfig.map((section) => (
                                    <Box key={section.title} mb={4}>
                                    <Typography variant="h6" color='#23326D' sx={{
                                        fontSize : {
                                            xs: 17.5,
                                            sm: 22
                                        }
                                    }} fontWeight={600} mb={2}>
                                        {section.title}
                                    </Typography>

                                    {section.items.map((item) => (
                                        <Box
                                        key={item.label}
                                        display="flex"
                                        justifyContent="space-between"
                                        py={1}
                                        borderBottom="1px solid #e2e2e2"
                                        >
                                        <Typography sx={{
                                            fontSize: {
                                                xs: 14,
                                                sm: 16,
                                                md: 17.5
                                            }
                                        }} color="#272836">
                                            {item.label}
                                        </Typography>
                                        
                                        <Typography
                                            fontWeight={500}
                                            color={item.negative ? 'error.main' : 'text.primary'}
                                            sx={{
                                                fontSize: {
                                                    xs: 14,
                                                    sm: 16,
                                                    md: 17.5
                                                }
                                            }}
                                        >
                                            {item.negative ? '-' : ''}{item.value} PLN
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
        </Box>
    );
});

// const breakdownConfig = useMemo(() => [
    //     {
    //         title: intl.formatMessage({ id: 'salary-title' }),
    //         items: [
    //             { label: 'Stawka miesięczna BRUTTO', value: calculation.workDaysPayment?.toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 1
    //             })},
    //             { label: 'Szacunkowa stawka godzinowa', value: calculation.perHour.toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 2
    //             })},
    //             { label: 'Premie / dodatki (brutto)', 
    //                value: (
    //                     (parseFloat(calculation.otherBonus as any) || 0) +
    //                     (parseFloat(calculation.attendanceBonus as any) || 0) +
    //                     (parseFloat(calculation.discretionaryBonus as any) || 0)
    //                 ).toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 1
    //             })
    //             },
    //             { label: 'Nadgodziny dzienne', value: calculation.dailyOvertimes?.toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 1
    //             })},
    //             { label: 'Nadgodz. w weekendy i święta', value: calculation.weekendHolidayOvertimes?.toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 1
    //             }) },
    //             { label: 'Nadgodziny nocne', value: calculation.nightOvertime?.toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 1
    //             }) },
    //             { label: 'Godziny nocne (dodatek)', value: calculation.nightHours?.toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 1
    //             }) },
    //             { label: 'Godziny na przełomie doby', value: calculation.turnOfDayHours?.toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 1
    //             }) },
    //             { label: 'L4 (wynagrodzenie chorobowe)', value: calculation.l4Payment?.toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 1
    //             }) },
    //             { label: 'Urlop', value: 0 },
    //             { label: 'BRUTTO razem', value: calculation.fullSalaryBrutto?.toLocaleString(undefined, {
    //                 minimumFractionDigits: 1,
    //                 maximumFractionDigits: 1
    //             })},
    //         ],
    //     },
    // ], [calculation]);

    // const getSalaryItems = (calculation: any, intl: any) => {
    //     const items: { label: string; value: any }[] = [
    //         { label: intl.formatMessage({ id: 'salary-monthly-rate' }), value: calculation.calculationType === 'employment' ? 
    //         calculation.workDaysPayment : calculation.perHour},
    //         { label: intl.formatMessage({ id: 'salary-hourly-rate' }), value: calculation.perHour?.toFixed(2) ?? 0 },
    //         { 
    //         label: intl.formatMessage({ id: 'salary-bonuses' }),
    //         value: (
    //             (parseFloat(calculation.otherBonus as any) || 0) +
    //             (parseFloat(calculation.attendanceBonus as any) || 0) +
    //             (parseFloat(calculation.discretionaryBonus as any) || 0)
    //         ).toFixed(2)
    //         },
    //     ];

    //     // Add items only for employment contracts
    //     if (calculation.calculationType === 'employment') {
    //         items.push(
    //         { label: intl.formatMessage({ id: 'salary-l4' }), value: calculation.l4Payment },
    //         { label: intl.formatMessage({ id: 'salary-vacation' }), value: 0 },
    //         { label: intl.formatMessage({ id: 'salary-daily-overtime' }), value: calculation.dailyOvertimes },
    //         { label: intl.formatMessage({ id: 'salary-weekend-overtime' }), value: calculation.weekendHolidayOvertimes },
    //         { label: intl.formatMessage({ id: 'salary-night-overtime' }), value: calculation.nightOvertime },
    //         { label: intl.formatMessage({ id: 'salary-night-hours' }), value: calculation.nightHours },
    //         { label: intl.formatMessage({ id: 'salary-turn-of-day-hours' }), value: calculation.turnOfDayHours },
    //         );
    //     }

    //     // Always show BRUTTO total
    //     items.push({ label: intl.formatMessage({ id: 'salary-brutto-total' }), value: calculation.fullSalaryBrutto });

    //     return {
    //         title: intl.formatMessage({ id: 'salary-title' }),
    //         items,
    //     };
    // };

// const formatCurrency = (value: number) =>
//   value.toLocaleString('pl-PL', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }) + ' zł';
    

// {
        //     title: 'ZUS',
        //     items: [
        //     { label: 'ZUS emerytalna', value: 561.2, negative: true },
        //     { label: 'ZUS rentowa', value: 86.25, negative: true },
        //     { label: 'ZUS chorobowa', value: 140.88, negative: true },
        //     { label: 'ZUS społeczne razem', value: 788.33, negative: true },
        //     ],
        // },
        // {
        //     title: 'Składka zdrowotna',
        //     items: [
        //     { label: 'Podstawa składki zdrowotnej', value: 4961.68 },
        //     { label: 'Składka zdrowotna 9%', value: 446.55, negative: true },
        //     ],
        // },
        // {
        //     title: 'PIT',
        //     items: [
        //     { label: 'Podstawa PIT', value: 4711.68 },
        //     { label: 'PIT', value: 265.4, negative: true },
        //     { label: 'Dodatkowe potrącenia (po podatku)', value: 0, negative: true },
        //     ],
        // },
        // {
        //     title: 'Podsumowanie',
        //     items: [
        //     { label: 'NETTO', value: 4249.72 },
        //     {
        //         label: 'Reżim PIT',
        //         value:
        //         'PIT: 12% od (BRUTTO − ZUS − KUP 250 zł) pomniejszone o ulgę (300 zł przy PIT-2).',
        //     },
        //     ],
        // },