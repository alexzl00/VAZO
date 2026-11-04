import { Box, Paper, Stack, Typography } from '@mui/material';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, type ChartOptions,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { useIntl } from 'react-intl';
import type { StatisticsResult } from '../../utils/salaryStatistics';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);
const background = '#FFFFFF';
const colors = ['#4A3AFF', '#A17CE3', '#E9AC66', '#D9D4EB', '#998DA7'];
const money = (value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
const card = { bgcolor: background, borderRadius: 3, border: '1px solid #E7E1F7', p: { xs: 2, md: 3 }, minWidth: 0 };

export default function StatisticsCharts({ statistics }: { statistics: StatisticsResult }) {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  const line: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${money(ctx.parsed.y ?? 0)}` } },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#EDE8F6' }, ticks: { callback: value => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(Number(value)) + ' zł' } },
    },
    elements: { point: { radius: 3, hoverRadius: 5 }, line: { tension: 0.15, spanGaps: false } },
  };
  const structure = statistics.detail.structure;
  const parts = structure ? [structure.basic, structure.overtime, structure.bonuses, structure.other, structure.unclassified] : [];
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.55fr) minmax(0, 1fr)' }, gap: 2 }}>
    <Paper elevation={0} sx={card}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ color: '#211331', fontWeight: 750 }}>{t('statistics-chart-history')}</Typography>
          <Typography variant="body2" sx={{ color: '#645877' }}>{t('statistics-chart-history-description')}</Typography>
        </Box>
        <Box sx={{ height: 298, minWidth: 0 }}>
          <Line options={line} data={{
            labels: statistics.points.map(p => p.key),
            datasets: [
              { label: t('statistics-gross'), data: statistics.points.map(p => p.gross), borderColor: '#4A3AFF', backgroundColor: '#4A3AFF' },
              { label: t('statistics-net'), data: statistics.points.map(p => p.net), borderColor: '#15927E', backgroundColor: '#15927E' },
            ],
          }}/>
        </Box>
      </Stack>
    </Paper>
    <Paper elevation={0} sx={card}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ color: '#211331', fontWeight: 750 }}>{t('statistics-chart-structure')}</Typography>
          <Typography variant="body2" sx={{ color: '#645877' }}>{t('statistics-chart-structure-description')}</Typography>
        </Box>
        {structure && parts.some(v => v > 0) ? <>
          <Box sx={{ height: 218, minWidth: 0 }}>
            <Doughnut data={{ labels: [t('statistics-basic'), t('statistics-overtime-and-allowances'), t('statistics-bonuses'), t('statistics-other-components'), t('statistics-unclassified')], datasets: [{ data: parts, backgroundColor: colors, borderWidth: 1, borderColor: '#fff' }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${money(Number(ctx.parsed))}` } } } }}/>
          </Box>
          <Stack spacing={1}>
            {parts.map((part, index) => <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#463C5C' }}><Box component="span" sx={{ display: 'inline-block', width: 9, height: 9, mr: 1, borderRadius: '3px', bgcolor: colors[index] }}/>{[t('statistics-basic'), t('statistics-overtime-and-allowances'), t('statistics-bonuses'), t('statistics-other-components'), t('statistics-unclassified')][index]}</Typography>
              <Typography variant="caption" fontWeight={750} sx={{ whiteSpace: 'nowrap' }}>{(part / parts.reduce((a, b) => a + b, 0) * 100).toLocaleString('pl-PL', { maximumFractionDigits: 1 })}%</Typography>
            </Box>)}
          </Stack>
        </> : <Typography variant="body2" color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>{t('statistics-breakdown-unavailable')}</Typography>}
      </Stack>
    </Paper>
  </Box>;
}
