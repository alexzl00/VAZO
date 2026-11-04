import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, CircularProgress, FormControl,
  IconButton, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  AccountBalanceWalletOutlined, AccessTimeOutlined, BeachAccessOutlined, CardGiftcardOutlined,
  FilterAltOutlined, InfoOutlined, LocalHospitalOutlined, PaymentsOutlined,
} from '@mui/icons-material';
import { useIntl } from 'react-intl';
import { getWorkRelations } from '../../api/work_relations';
import { getAnnualStatisticsFacts, getStatisticsSalaries } from '../../api/salaryStatistics';
import type { WorkRelation } from '../../types/workRelation';
import {
  buildAnnualFacts, buildSalaryStatistics, getAnnualLimits, monthKey,
  relationOverlapsPeriod, type AnnualFactRecord, type StatisticsGrouping,
  type StatisticsPeriod, type StatisticsSalary,
} from '../../utils/salaryStatistics';
import { formatMoneyPl } from '../../utils/money-format';
import InfoDialog from '../../components/Modals/InfoDialog';
import StatisticsCharts from '../../sections/statistics/StatisticsCharts';

type Preset = 'year' | '3m' | '6m' | '12m' | 'custom';
const palette = { background: '#DFDCFD', ink: '#211331', accent: '#4A3AFF', muted: '#625675', border: '#E9E4F5' };
const card = { bgcolor: '#fff', border: `1px solid ${palette.border}`, borderRadius: 3, p: { xs: 2, md: 3 }, boxShadow: '0 4px 18px rgba(33, 19, 49, 0.035)' };
const currentMonth = () => monthKey(new Date().getFullYear(), new Date().getMonth() + 1);
const monthBefore = (months: number) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - months, 1);
  return monthKey(d.getFullYear(), d.getMonth() + 1);
};
function chosenPeriod(preset: Preset, custom: StatisticsPeriod): StatisticsPeriod {
  if (preset === 'custom') return custom;
  const end = currentMonth();
  if (preset === 'year') return { start: `${end.slice(0, 4)}-01`, end };
  return { start: monthBefore(preset === '3m' ? 2 : preset === '6m' ? 5 : 11), end };
}
function validPeriod(period: StatisticsPeriod) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period.start) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period.end)) return false;
  const [startY, startM] = period.start.split('-').map(Number);
  const [endY, endM] = period.end.split('-').map(Number);
  const length = (endY - startY) * 12 + endM - startM + 1;
  return startY >= 2000 && endY <= 9999 && length >= 1 && length <= 120;
}
function yearsInPeriod(period: StatisticsPeriod): number[] {
  if (!validPeriod(period)) return [];
  const first = Number(period.start.slice(0, 4));
  const last = Number(period.end.slice(0, 4));
  return Array.from({ length: last - first + 1 }, (_unused, index) => first + index);
}
const money = (value: number | null | undefined) => value == null ? '—' : `${formatMoneyPl(value)} zł`;
const count = (value: number | null | undefined, decimals = 0) => value == null ? '—' : new Intl.NumberFormat('pl-PL', { maximumFractionDigits: decimals }).format(value);

export default function StatisticsPage() {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  const [preset, setPreset] = useState<Preset>('year');
  const [customPeriod, setCustomPeriod] = useState<StatisticsPeriod>(() => ({ start: `${new Date().getFullYear()}-01`, end: currentMonth() }));
  const [grouping, setGrouping] = useState<StatisticsGrouping>('month');
  // null selects all work relations overlapping the period; [] explicitly selects none.
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [relations, setRelations] = useState<WorkRelation[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(true);
  const [relationsError, setRelationsError] = useState(false);
  const [salaries, setSalaries] = useState<StatisticsSalary[]>([]);
  const [salaryQuery, setSalaryQuery] = useState('');
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryError, setSalaryError] = useState(false);
  const [annualRows, setAnnualRows] = useState<AnnualFactRecord[]>([]);
  const [annualLoadedKey, setAnnualLoadedKey] = useState<string | null>(null);
  const [annualLoading, setAnnualLoading] = useState(false);
  const [annualError, setAnnualError] = useState(false);
  const [annualYear, setAnnualYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);

  const period = useMemo(() => chosenPeriod(preset, customPeriod), [preset, customPeriod]);
  const valid = validPeriod(period);
  const years = useMemo(() => yearsInPeriod(period), [period]);
  useEffect(() => {
    if (years.length && !years.includes(annualYear)) setAnnualYear(years[years.length - 1]);
  }, [years, annualYear]);

  useEffect(() => {
    let active = true;
    void getWorkRelations().then(result => { if (active) setRelations(result); })
      .catch(() => { if (active) setRelationsError(true); })
      .finally(() => { if (active) setRelationsLoading(false); });
    return () => { active = false; };
  }, []);
  const available = useMemo(() => valid ? relations.filter(r => relationOverlapsPeriod(r, period)) : [], [relations, period, valid]);
  const selected = useMemo(() => available.filter(r => selectedIds === null || selectedIds.includes(r.id)), [available, selectedIds]);
  const ids = useMemo(() => selected.map(r => r.id).sort(), [selected]);
  const queryKey = `${period.start}:${period.end}:${ids.join('|')}`;
  // The annual year is always full, but relation selection matches the dashboard.
  const annualQueryKey = `${annualYear}:${ids.join('|')}`;

  useEffect(() => {
    let active = true;
    setSalaryError(false); setSalaryQuery(''); setSalaries([]);
    if (!valid || relationsLoading || relationsError || ids.length === 0) { setSalaryLoading(false); return () => { active = false; }; }
    setSalaryLoading(true);
    void getStatisticsSalaries(period, ids).then(result => {
      if (active) { setSalaries(result); setSalaryQuery(queryKey); }
    }).catch(() => { if (active) setSalaryError(true); })
      .finally(() => { if (active) setSalaryLoading(false); });
    return () => { active = false; };
  }, [period, ids, queryKey, valid, relationsLoading, relationsError]);

  useEffect(() => {
    let active = true;
    setAnnualRows([]); setAnnualLoadedKey(null); setAnnualError(false);
    if (relationsLoading || relationsError || !valid || !years.includes(annualYear) || ids.length === 0) {
      setAnnualLoading(false);
      return () => { active = false; };
    }
    setAnnualLoading(true);
    void getAnnualStatisticsFacts(annualYear, ids).then(result => {
      if (active) { setAnnualRows(result); setAnnualLoadedKey(annualQueryKey); }
    }).catch(() => { if (active) setAnnualError(true); })
      .finally(() => { if (active) setAnnualLoading(false); });
    return () => { active = false; };
  }, [annualYear, annualQueryKey, ids, years, relationsLoading, relationsError, valid]);

  const aggregate = useMemo(() => {
    if (!valid) return null;
    try { return buildSalaryStatistics(salaries, period, grouping); }
    catch (error) { console.error('Statistics data error:', error); return null; }
  }, [salaries, period, grouping, valid]);
  const annual = useMemo(() => annualLoadedKey === annualQueryKey
    ? buildAnnualFacts(annualYear, annualRows, selected) : null,
    [annualYear, annualLoadedKey, annualQueryKey, annualRows, selected]);
  const limits = getAnnualLimits(annualYear);
  const summary = aggregate?.summary;
  const ready = valid && salaryQuery === queryKey && !salaryLoading && !salaryError && !relationsLoading && ids.length > 0;

  function totalCard(name: string, total: number, averageLabel: string, average: number, icon: ReactNode) {
    return <Grid size={{ xs: 12, md: 6 }}>
      <Paper elevation={0} sx={{ ...card, height: '100%' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: palette.ink }}>
          <Box sx={{ p: 1.2, bgcolor: '#F2EEFB', color: palette.accent, borderRadius: 2 }}>{icon}</Box>
          <Typography fontWeight={700}>{name}</Typography>
        </Stack>
        <Typography variant="h4" sx={{ mt: 2, fontWeight: 800, color: palette.ink }}>{money(total)}</Typography>
        <Box sx={{ borderTop: `1px solid ${palette.border}`, mt: 2, pt: 1.5 }}>
          <Typography variant="body2" color="text.secondary">{averageLabel}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 750, color: palette.accent }}>{money(average)}</Typography>
        </Box>
      </Paper>
    </Grid>;
  }
  function detailCard(title: string, icon: ReactNode, children: ReactNode) {
    return <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
      <Paper elevation={0} sx={{ ...card, height: '100%' }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: palette.ink }}>
            <Box sx={{ color: palette.accent }}>{icon}</Box><Typography fontWeight={750}>{title}</Typography>
          </Stack>
          {children}
        </Stack>
      </Paper>
    </Grid>;
  }
  function detailRow(label: string, value: string) {
    return <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
      <Typography variant="body2" sx={{ color: palette.muted }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: palette.ink, fontWeight: 750, textAlign: 'right' }}>{value}</Typography>
    </Stack>;
  }
  const annualPanel = <>
    {valid && ids.length > 0 && !relationsLoading && !relationsError && <Paper elevation={0} sx={card}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Box><Typography variant="h6" sx={{ fontWeight: 750 }}>{t('statistics-annual-limits')}</Typography><Typography variant="caption" color="text.secondary">{t('statistics-annual-selected-relations')}</Typography></Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {years.length > 1 ? <FormControl size="small" sx={{ minWidth: 95 }}><InputLabel>{t('statistics-year')}</InputLabel>
            <Select label={t('statistics-year')} value={years.includes(annualYear) ? annualYear : ''} onChange={event => setAnnualYear(Number(event.target.value))}>
              {years.map(year => <MenuItem value={year} key={year}>{year}</MenuItem>)}
            </Select></FormControl> : <Typography fontWeight={700}>{annualYear}</Typography>}
          <Tooltip title={t('statistics-annual-info')}><IconButton aria-label={t('statistics-annual-info')} onClick={() => setModalOpen(true)}><InfoOutlined sx={{ color: palette.accent }}/></IconButton></Tooltip>
        </Stack>
      </Stack>
      {annualLoading && <CircularProgress size={20}/>}
      {!annualLoading && annual && <>
        <Grid container spacing={2}>
          {([
            ['taxableIncome','statistics-taxable-income'],
            ['pit0Revenue','statistics-pit0-revenue'],
            ['pensionDisabilityBase','statistics-pension-base'],
          ] as const).map(([field,label]) => {
            const limit = limits[field];
            const value = annual.values[field];
            const hasIncomplete = annual.missingFactsByField[field] > 0 || annual.missingMonths > 0;
            return <Grid size={{ xs: 12, md: 4 }} key={field}>
              <Box sx={{ borderRadius: 2, p: 2, height: '100%', bgcolor: '#F7F4FF', border: `1px solid ${palette.border}` }}>
                <Typography fontWeight={700} variant="body2">{t(label)}</Typography>
                <Typography sx={{ fontWeight: 800, mt: 1 }}>{hasIncomplete ? t('statistics-at-least') + ' ' : ''}{money(value)}</Typography>
                <Typography variant="caption" sx={{ color: palette.muted }}>{t('statistics-limit')}: {money(limit)}</Typography>
                <LinearProgress variant="determinate" value={limit ? Math.max(0, Math.min(100, value / limit * 100)) : 0}
                  sx={{ mt: 2, height: 8, borderRadius: 9, bgcolor: '#E4DDF6', '& .MuiLinearProgress-bar': { bgcolor: palette.accent } }}/>
                <Typography variant="caption" sx={{ color: palette.muted }}>{limit ? `${count(value / limit * 100, 1)}%` : t('statistics-limit-unknown')}</Typography>
              </Box>
            </Grid>;
          })}
        </Grid>
        {(annual.missingFacts > 0 || annual.missingMonths > 0) && <Alert severity="warning" sx={{ mt: 2 }}>
          {t('statistics-annual-incomplete')} ({annual.missingFacts} / {annual.missingMonths})
        </Alert>}
      </>}
    </Paper>}

  </>;
  return <Stack spacing={2.5} sx={{ py: 2, pb: 5, color: palette.ink }}>
    <Box><Typography variant="h4" fontWeight={800}>{t('statistics-title')}</Typography><Typography color="text.secondary">{t('statistics-description')}</Typography></Box>
    <Paper elevation={0} sx={card}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}><FilterAltOutlined color="primary"/><Typography variant="h6" fontWeight={750}>{t('statistics-filters')}</Typography></Stack>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><FormControl fullWidth size="small"><InputLabel>{t('statistics-period')}</InputLabel>
          <Select value={preset} label={t('statistics-period')} onChange={event => setPreset(event.target.value as Preset)}>
            {(['year','3m','6m','12m','custom'] as const).map(p => <MenuItem key={p} value={p}>{t(`statistics-period-${p}`)}</MenuItem>)}
          </Select></FormControl></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><FormControl fullWidth size="small"><InputLabel>{t('statistics-grouping')}</InputLabel>
          <Select value={grouping} label={t('statistics-grouping')} onChange={event => setGrouping(event.target.value as StatisticsGrouping)}>
            {(['month','quarter','year'] as const).map(p => <MenuItem key={p} value={p}>{t(`statistics-grouping-${p}`)}</MenuItem>)}
          </Select></FormControl></Grid>
        {preset === 'custom' && <>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><TextField fullWidth size="small" type="month" label={t('statistics-from')} value={customPeriod.start} slotProps={{ inputLabel: { shrink: true } }} onChange={event => setCustomPeriod(prev => ({ ...prev, start: event.target.value }))}/></Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><TextField fullWidth size="small" type="month" label={t('statistics-to')} value={customPeriod.end} slotProps={{ inputLabel: { shrink: true } }} onChange={event => setCustomPeriod(prev => ({ ...prev, end: event.target.value }))}/></Grid>
        </>}
        <Grid size={{ xs: 12 }}>
          <Autocomplete multiple disableCloseOnSelect size="small" options={available} loading={relationsLoading} value={selected}
            isOptionEqualToValue={(a,b) => a.id === b.id}
            getOptionLabel={r => r.employer_name ? `${r.name} — ${r.employer_name}` : r.name}
            onChange={(_event, next) => setSelectedIds(next.map(r => r.id))}
            renderOption={(props, option, state) => { const { key, ...rest } = props; return <li key={key} {...rest}>
              <Checkbox checked={state.selected} sx={{ mr: 1 }}/><Box><Typography variant="body2">{option.name}</Typography><Typography variant="caption" color="text.secondary">{option.employer_name ? `${option.employer_name} · ` : ''}{option.contract_type.toUpperCase()}</Typography></Box>
            </li>; }}
            renderValue={(values, getItemProps) => values.map((r,index) => { const { key, ...props } = getItemProps({ index }); return <Chip key={key} size="small" label={r.name} {...props}/>; })}
            renderInput={params => <TextField {...params} label={t('statistics-work-relations')} placeholder={selected.length ? '' : t('statistics-relations-placeholder')}/>}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" onClick={() => setSelectedIds(null)}>{t('statistics-all-relations')}</Button>
            <Button size="small" onClick={() => setSelectedIds([])}>{t('statistics-clear')}</Button>
            <Typography variant="caption" sx={{ ml: 'auto !important', alignSelf: 'center', color: palette.muted }}>{selected.length}/{available.length}</Typography>
          </Stack>
        </Grid>
      </Grid>
      {!valid && <Alert severity="warning" sx={{ mt: 2 }}>{t('statistics-invalid-period')}</Alert>}
    </Paper>

    {(relationsError || salaryError || annualError) && <Alert severity="error">{t('statistics-loading-error')}</Alert>}
    {(relationsLoading || salaryLoading) && <Stack direction="row" spacing={1.5} alignItems="center"><CircularProgress size={19}/><Typography variant="body2">{t('statistics-loading')}</Typography></Stack>}
    {!relationsLoading && !relationsError && valid && !available.length && <Alert severity="info">{t('statistics-no-relations')}</Alert>}
    {available.length > 0 && !selected.length && <Alert severity="info">{t('statistics-select-relations')}</Alert>}
    {ready && aggregate === null && <Alert severity="error">{t('statistics-invalid-financial-data')}</Alert>}
    {ready && aggregate && summary && <>
      {!summary.recordCount && <Alert severity="info">{t('statistics-no-records')}</Alert>}
      {!!summary.recordCount && <>
        <Grid container spacing={2}>
          {totalCard(t('statistics-total-net'), summary.net, t('statistics-average-net'), summary.averageNet, <AccountBalanceWalletOutlined/>)}
          {totalCard(t('statistics-total-gross'), summary.gross, t('statistics-average-gross'), summary.averageGross, <PaymentsOutlined/>)}
        </Grid>
        {annualPanel}
        <StatisticsCharts statistics={aggregate}/>
        <Grid container spacing={2}>
          {detailCard(t('statistics-bonuses'), <CardGiftcardOutlined/>, <>
            <Typography variant="h5" fontWeight={800}>{money(summary.bonusCash)}</Typography>
            {detailRow(t('statistics-bonuses-noncash'), money(summary.bonusNonCash))}
          </>)}
          {detailCard(t('statistics-overtime'), <AccessTimeOutlined/>, <>
            <Typography variant="h5" fontWeight={800}>{count(summary.overtimeHours, 4)} h</Typography>
            {detailRow(t('statistics-overtime-payment'), money(aggregate.detail.overtimePayout))}
            {detailRow(t('statistics-turn-of-day-hours'), `${count(summary.turnOfDayHours, 4)} h`)}
          </>)}
          {detailCard(t('statistics-sick-leave'), <LocalHospitalOutlined/>, <>
            <Typography variant="h5" fontWeight={800}>{count(summary.l4Days)} {t('statistics-days')}</Typography>
            {detailRow(t('statistics-employer-sick-pay'), money(aggregate.detail.employerSickPay))}
            {detailRow(t('statistics-sickness-benefit'), money(aggregate.detail.sicknessBenefit))}
            {detailRow(t('statistics-employer-sick-days'), count(aggregate.detail.employerSickPayDays))}
            {detailRow(t('statistics-sickness-benefit-days'), count(aggregate.detail.sicknessBenefitDays))}
          </>)}
          {detailCard(t('statistics-vacation'), <BeachAccessOutlined/>, <>
            <Typography variant="h5" fontWeight={800}>{count(summary.vacationDays, 2)} {t('statistics-days')}</Typography>
            {detailRow(t('statistics-vacation-hours'), `${count(summary.vacationHours)} h`)}
            {detailRow(t('statistics-vacation-payment'), money(aggregate.detail.vacationPayment))}
          </>)}
        </Grid>
        {aggregate.detail.missingRecordCount > 0 && <Typography variant="caption" sx={{ color: palette.muted }}>{t('statistics-unclassified-note')}</Typography>}
        <Typography variant="caption" sx={{ color: palette.muted }}>{t('statistics-average-note')}</Typography>
      </>}
    </>}

    {(!ready || !summary?.recordCount) && annualPanel}
    <InfoDialog open={modalOpen} onClose={() => setModalOpen(false)} title={t('statistics-annual-limits')} info={<Stack spacing={2}>
      <Typography variant="body2">{t('statistics-annual-modal-general')}</Typography>
      <Typography variant="body2"><strong>{t('statistics-taxable-income')}:</strong> {t('statistics-annual-modal-pit')}</Typography>
      <Typography variant="body2"><strong>{t('statistics-pit0-revenue')}:</strong> {t('statistics-annual-modal-pit0')}</Typography>
      <Typography variant="body2"><strong>{t('statistics-pension-base')}:</strong> {t('statistics-annual-modal-pension')}</Typography>
      <Alert severity="info">{t('statistics-annual-modal-scope')}</Alert>
    </Stack>}/>
  </Stack>;
}
