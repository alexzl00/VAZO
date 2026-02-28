import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, type ChartOptions, type Plugin } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

import { useRef, useState } from 'react';
import type { Chart as ChartJSInstance } from 'chart.js';
import { StarBorder } from '@mui/icons-material';

ChartJS.register(ArcElement, Tooltip);

const labels = [
    'PIT',
    'ZUS emerytalne',
    'ZUS rentowe',
    'ZUS chorobowe',
    'NFZ',
];

const taxData = [1440, 1170, 180, 294, 931];
const colors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
];

export const data = {
    labels,
    datasets: [
        {
            data: taxData,
            backgroundColor: colors,
            borderColor: 'rgba(0,0,0,0)',
            hoverBorderColor: colors,
            radius: '90%',
            hoverOffset: 10,
        },
    ],
};

const options: ChartOptions<'doughnut'> = {
    cutout: '70%',
    animation: { duration: 1500 },
    transitions: { 
        active: { 
            animation: { 
                duration: 200
            } 
        },
        fast: { 
            animation: { 
                duration: 150
            } 
        }
    },
    plugins: {
        tooltip: {
        bodyFont: { family: "'Poppins', sans-serif" },
        titleFont: { family: "'Poppins', sans-serif" },
        callbacks: {
            label: (context) => {
            const value = context.parsed;
            const total = taxData.reduce((a, b) => a + b, 0);
            console.log(total)
            const percent = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value.toLocaleString()} zł (${percent}%)`;
            },
        },
        },
    },
};

const BRUTTO = 12000;

const bruttoPension: Plugin<'doughnut'> = {
    id: 'centerText',
    afterDatasetsDraw: (chart) => {
    const { ctx } = chart;

    ctx.save();

    ctx.font = '500 22px poppins';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0a1936';
    ctx.fillText(`${BRUTTO.toLocaleString()} zł`, chart.width / 2, chart.height / 2 - 10);
    ctx.fillText('brutto', chart.width / 2, chart.height / 2 + 15);

    ctx.restore();
  },
};

export default function TaxChart() {
    const total = taxData.reduce((a, b) => a + b, 0);
    const chartRef = useRef<ChartJSInstance<'doughnut'> | null>(null);
    // const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [hoverIndex, setHoveredIndex] = useState<number | null>(null);
    
    return (
        <Box display="flex" gap={5} alignItems="center" sx={{
            flexDirection: {xs: 'column', sm: 'row'}
        }}>
            {/* CHART */}
            <Box maxWidth={200} p={2}>
                <Doughnut 
                    data={data} 
                    options={options} 
                    plugins={[bruttoPension]}
                    ref={chartRef} 
                />
            </Box>

            {/* LEGEND */}
            <Box>
                {labels.map((label, index) => {
                    const value = taxData[index];
                    const percent = ((value / total) * 100).toFixed(1);
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
                                    transform: hoverIndex === index ? 'scale(1.1)' : 'unset',
                                    transition: 'all 0.2s ease-in'
                                }}
                                onMouseEnter={() => {
                                    const chart = chartRef.current;
                                    if (!chart) return;
                                    setHoveredIndex(index);

                                    chart.setActiveElements([
                                        { datasetIndex: 0, index: index },
                                    ]);

                                    chart.update('fast');
                                }}

                                onMouseLeave={() => {
                                    const chart = chartRef.current;
                                    if (!chart) return;

                                    setHoveredIndex(null);
                                    chart.setActiveElements([]);
                                    chart.update('fast');
                                }}
                            >
                            </Box>
                            <Typography fontFamily="Poppins" fontSize={16} fontWeight={500}>
                                {label}: {value.toLocaleString()} zł ({percent}%)
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};