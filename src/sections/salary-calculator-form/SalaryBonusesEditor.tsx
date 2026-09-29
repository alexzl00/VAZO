import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useIntl } from 'react-intl';

import {
  getSalaryBonusDefinitions,
  setSalaryBonusDefinitionActive,
} from '../../api/bonusDefinitions';

import type {
  BonusFrequency,
  BonusPaymentType,
  SalaryBonus,
  SalaryBonusDefinition,
} from '../../types/salaryCalculator';

type SalaryBonusesEditorProps = {
  bonuses: SalaryBonus[];
  workRelationId?: string | null;
  setFieldValue: (
    field: string,
    value: unknown,
    shouldValidate?: boolean,
  ) => void;
};

type DialogMode = 'add' | 'manage';
type DefinitionStatus = 'active' | 'inactive';

const createBonusId = () =>
  `bonus-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const editorWidthSx = {
  width: '320px',
  maxWidth: '100%',
  minWidth: 0,
  mx: 'auto',
};

const bonusColors = {
  indigo: '#3B4DB3',
  indigoDark: '#23326D',
  indigoSoft: '#F4F6FF',
  green: 'rgb(7, 173, 82)',
  greenDark: 'rgb(5, 145, 68)',
  greenSoft: 'rgba(7, 173, 82, 0.08)',
  brown: 'rgb(149, 57, 4)',
  brownDark: 'rgb(122, 46, 3)',
  brownSoft: 'rgba(149, 57, 4, 0.08)',
};

const fieldSx = {
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'text.primary',
  },
  '& .MuiOutlinedInput-root': {
    bgcolor: 'background.paper',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'divider',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'text.secondary',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'text.primary',
      borderWidth: 1,
    },
  },
};

export default function SalaryBonusesEditor({
  bonuses,
  workRelationId,
  setFieldValue,
}: SalaryBonusesEditorProps) {
  const intl = useIntl();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('add');
  const [definitionStatus, setDefinitionStatus] =
    useState<DefinitionStatus>('active');
  const [definitions, setDefinitions] =
    useState<SalaryBonusDefinition[]>([]);
  const [definitionsLoading, setDefinitionsLoading] = useState(false);
  const [definitionsError, setDefinitionsError] = useState(false);
  const [definitionActionId, setDefinitionActionId] =
    useState<string | null>(null);

  const updateBonus = (
    bonusId: string,
    patch: Partial<SalaryBonus>,
  ) => {
    setFieldValue(
      'bonuses',
      bonuses.map((bonus) =>
        bonus.id === bonusId
          ? { ...bonus, ...patch }
          : bonus,
      ),
      true,
    );
  };

  const appendBonus = (bonus: SalaryBonus) => {
    setFieldValue('bonuses', [...bonuses, bonus], true);
  };

  const addNewBonus = () => {
    const nextBonus: SalaryBonus = {
      id: createBonusId(),
      bonusDefinitionId: null,
      rememberForFuture: false,
      isNewBonus: true,
      name: '',
      amount: 0,
      frequency: 'monthly',
      paymentType: 'cash',
    };

    appendBonus(nextBonus);
    setDialogOpen(false);
  };

  const addSavedBonus = (definition: SalaryBonusDefinition) => {
    const nextBonus: SalaryBonus = {
      id: createBonusId(),
      bonusDefinitionId: definition.id,
      rememberForFuture: false,
      isNewBonus: true,
      name: definition.name,
      amount: definition.currentAmount,
      frequency: definition.frequency,
      paymentType: definition.paymentType,
      amountType: definition.amountType,
      sickLeaveTreatment: definition.sickLeaveTreatment,
      vacationTreatment: definition.vacationTreatment,
    };

    appendBonus(nextBonus);
    setDialogOpen(false);
  };

  const removeBonus = (bonusId: string) => {
    setFieldValue(
      'bonuses',
      bonuses.filter((bonus) => bonus.id !== bonusId),
      true,
    );
  };

  const loadDefinitions = useCallback(async (
    status: DefinitionStatus,
  ) => {
    if (!workRelationId) {
      setDefinitions([]);
      setDefinitionsError(false);
      return;
    }

    try {
      setDefinitionsLoading(true);
      setDefinitionsError(false);

      const data = await getSalaryBonusDefinitions(
        workRelationId,
        status,
      );

      setDefinitions(data);
    } catch (error) {
      console.error('Failed to load saved bonuses:', error);
      setDefinitions([]);
      setDefinitionsError(true);
    } finally {
      setDefinitionsLoading(false);
    }
  }, [workRelationId]);

  useEffect(() => {
    if (!dialogOpen || !workRelationId) return;

    const status = dialogMode === 'add'
      ? 'active'
      : definitionStatus;

    void loadDefinitions(status);
  }, [
    definitionStatus,
    dialogMode,
    dialogOpen,
    loadDefinitions,
    workRelationId,
  ]);

  useEffect(() => {
    if (!workRelationId) {
      setDialogOpen(false);
      setDefinitions([]);
    }
  }, [workRelationId]);

  const openAddDialog = () => {
    if (!workRelationId) {
      addNewBonus();
      return;
    }

    setDialogMode('add');
    setDefinitionStatus('active');
    setDialogOpen(true);
  };

  const openManageMode = () => {
    setDialogMode('manage');
    setDefinitionStatus('active');
  };

  const handleDefinitionActivityChange = async (
    definitionId: string,
    isActive: boolean,
  ) => {
    try {
      setDefinitionActionId(definitionId);
      setDefinitionsError(false);

      await setSalaryBonusDefinitionActive(
        definitionId,
        isActive,
      );

      await loadDefinitions(definitionStatus);
    } catch (error) {
      console.error('Failed to update saved bonus:', error);
      setDefinitionsError(true);
    } finally {
      setDefinitionActionId(null);
    }
  };

  const renderDefinitionsState = () => {
    if (definitionsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (definitionsError) {
      return (
        <Alert severity="error">
          {intl.formatMessage({
            id: 'saved-bonuses-load-failed',
            defaultMessage: 'Failed to load saved bonuses.',
          })}
        </Alert>
      );
    }

    if (definitions.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          {intl.formatMessage({
            id:
              dialogMode === 'manage' && definitionStatus === 'inactive'
                ? 'saved-bonuses-inactive-empty'
                : 'saved-bonuses-active-empty',
            defaultMessage:
              dialogMode === 'manage' && definitionStatus === 'inactive'
                ? 'No inactive saved bonuses.'
                : 'No active saved bonuses yet.',
          })}
        </Typography>
      );
    }

    return (
      <Stack spacing={1}>
        {definitions.map((definition) => (
          <Box
            key={definition.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              minWidth: 0,
              px: 1.5,
              py: 1.25,
              border: 1,
              borderColor:
                definitionStatus === 'active'
                  ? bonusColors.indigo
                  : bonusColors.brown,
              borderRadius: 1.5,
              bgcolor:
                definitionStatus === 'active'
                  ? bonusColors.indigoSoft
                  : bonusColors.brownSoft,
              transition: 'border-color .2s ease, background-color .2s ease, transform .2s ease',
              '&:hover': {
                borderColor:
                  definitionStatus === 'active'
                    ? bonusColors.indigoDark
                    : bonusColors.brownDark,
                transform: 'translateY(-1px)',
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                color={
                  definitionStatus === 'active'
                    ? bonusColors.indigoDark
                    : bonusColors.brownDark
                }
                noWrap
              >
                {definition.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {definition.currentAmount.toLocaleString('pl-PL', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                zł
              </Typography>
            </Box>

            {dialogMode === 'add' ? (
              <Button
                size="small"
                variant="contained"
                sx={{
                  flexShrink: 0,
                  bgcolor: bonusColors.indigo,
                  '&:hover': { bgcolor: bonusColors.indigoDark },
                }}
                onClick={() => addSavedBonus(definition)}
              >
                {intl.formatMessage({
                  id: 'saved-bonuses-add-existing',
                  defaultMessage: 'Add',
                })}
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                sx={{
                  flexShrink: 0,
                  color: '#fff',
                  bgcolor:
                    definitionStatus === 'active'
                      ? bonusColors.brown
                      : bonusColors.green,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor:
                      definitionStatus === 'active'
                        ? bonusColors.brownDark
                        : bonusColors.greenDark,
                    boxShadow: 'none',
                  },
                }}
                disabled={definitionActionId === definition.id}
                onClick={() => void handleDefinitionActivityChange(
                  definition.id,
                  definitionStatus !== 'active',
                )}
              >
                {definitionActionId === definition.id
                  ? intl.formatMessage({
                      id: 'saved-bonuses-saving',
                      defaultMessage: 'Saving...',
                    })
                  : intl.formatMessage({
                      id:
                        definitionStatus === 'active'
                          ? 'saved-bonuses-discontinue'
                          : 'saved-bonuses-reactivate',
                      defaultMessage:
                        definitionStatus === 'active'
                          ? 'Discontinue bonus'
                          : 'Reactivate',
                    })}
              </Button>
            )}
          </Box>
        ))}
      </Stack>
    );
  };

  return (
    <>
      <Stack spacing={1.5} sx={editorWidthSx}>
        {bonuses.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
          >
            {intl.formatMessage({
              id: 'rate-and-bonuses-empty',
              defaultMessage: 'No bonuses added.',
            })}
          </Typography>
        )}

        {bonuses.map((bonus) => (
          <Box
            key={bonus.id}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: bonusColors.indigoSoft,
              boxShadow: '0 2px 8px rgba(35, 50, 109, 0.08)',
              transition: 'box-shadow .2s ease, transform .2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(35, 50, 109, 0.12)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            <Stack spacing={1.5}>
              <TextField
                size="small"
                fullWidth
                label={intl.formatMessage({
                  id: 'rate-and-bonuses-bonus-name',
                  defaultMessage: 'Bonus name',
                })}
                sx={fieldSx}
                value={bonus.name}
                onChange={(event) =>
                  updateBonus(bonus.id, {
                    name: event.target.value,
                  })
                }
              />

              <TextField
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                label={intl.formatMessage({
                  id: 'rate-and-bonuses-bonus-amount',
                  defaultMessage: 'Amount',
                })}
                sx={fieldSx}
                value={bonus.amount}
                onChange={(event) =>
                  updateBonus(bonus.id, {
                    amount:
                      event.target.value === ''
                        ? 0
                        : Number(event.target.value),
                  })
                }
              />

              <TextField
                select
                size="small"
                fullWidth
                label={intl.formatMessage({
                  id: 'rate-and-bonuses-bonus-frequency',
                  defaultMessage: 'Frequency',
                })}
                sx={fieldSx}
                value={bonus.frequency}
                onChange={(event) =>
                  updateBonus(bonus.id, {
                    frequency: event.target.value as BonusFrequency,
                  })
                }
              >
                <MenuItem value="monthly">
                  {intl.formatMessage({
                    id: 'bonus-frequency-monthly',
                    defaultMessage: 'Monthly',
                  })}
                </MenuItem>
                <MenuItem value="quarterly">
                  {intl.formatMessage({
                    id: 'bonus-frequency-quarterly',
                    defaultMessage: 'Quarterly',
                  })}
                </MenuItem>
                <MenuItem value="annual">
                  {intl.formatMessage({
                    id: 'bonus-frequency-annual',
                    defaultMessage: 'Annual',
                  })}
                </MenuItem>
                <MenuItem value="oneOff">
                  {intl.formatMessage({
                    id: 'bonus-frequency-one-off',
                    defaultMessage: 'One-off',
                  })}
                </MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                fullWidth
                label={intl.formatMessage({
                  id: 'rate-and-bonuses-bonus-payment-type',
                  defaultMessage: 'Payment type',
                })}
                sx={fieldSx}
                value={bonus.paymentType ?? 'cash'}
                onChange={(event) =>
                  updateBonus(bonus.id, {
                    paymentType: event.target.value as BonusPaymentType,
                  })
                }
              >
                <MenuItem value="cash">
                  {intl.formatMessage({
                    id: 'bonus-payment-cash',
                    defaultMessage: 'Cash',
                  })}
                </MenuItem>
                <MenuItem value="nonCash">
                  {intl.formatMessage({
                    id: 'bonus-payment-non-cash',
                    defaultMessage: 'Non-cash',
                  })}
                </MenuItem>
              </TextField>

              {bonus.isNewBonus && !bonus.bonusDefinitionId && (
                <Box
                  sx={{
                    pt: 0.5,
                    borderTop: 1,
                    borderColor: 'rgba(59, 77, 179, 0.24)',
                  }}
                >
                  <FormControlLabel
                    sx={{ m: 0 }}
                    control={(
                      <Checkbox
                        size="small"
                        sx={{
                          color: bonusColors.indigo,
                          '&.Mui-checked': { color: bonusColors.indigo },
                        }}
                        checked={Boolean(bonus.rememberForFuture)}
                        onChange={(event) =>
                          updateBonus(bonus.id, {
                            rememberForFuture: event.target.checked,
                          })
                        }
                      />
                    )}
                    label={(
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={bonusColors.indigoDark}
                      >
                        {intl.formatMessage({
                          id: 'saved-bonuses-remember',
                          defaultMessage: 'Remember bonus',
                        })}
                      </Typography>
                    )}
                  />
                  <FormHelperText sx={{ mt: 0, ml: 4 }}>
                    {intl.formatMessage({
                      id: 'saved-bonuses-remember-helper',
                      defaultMessage:
                        'It will be available for future salaries.',
                    })}
                  </FormHelperText>
                </Box>
              )}

              <Button
                size="small"
                variant="outlined"
                sx={{
                  alignSelf: 'flex-start',
                  color: bonusColors.brown,
                  borderColor: bonusColors.brown,
                  '&:hover': {
                    bgcolor: bonusColors.brownSoft,
                    borderColor: bonusColors.brownDark,
                  },
                }}
                onClick={() => removeBonus(bonus.id)}
              >
                {intl.formatMessage({
                  id: 'rate-and-bonuses-remove-bonus',
                  defaultMessage: 'Remove bonus',
                })}
              </Button>
            </Stack>
          </Box>
        ))}

        <Button
          fullWidth
          variant="contained"
          sx={{
            bgcolor: bonusColors.indigo,
            '&:hover': { bgcolor: bonusColors.indigoDark },
          }}
          onClick={openAddDialog}
        >
          {intl.formatMessage({
            id: 'rate-and-bonuses-add-bonus',
            defaultMessage: 'Add bonus',
          })}
        </Button>
      </Stack>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            color: bonusColors.indigoDark,
            fontWeight: 700,
            borderBottom: `3px solid ${bonusColors.indigo}`,
            bgcolor: bonusColors.indigoSoft,
          }}
        >
          {intl.formatMessage({
            id:
              dialogMode === 'add'
                ? 'saved-bonuses-add-title'
                : 'saved-bonuses-manage-title',
            defaultMessage:
              dialogMode === 'add'
                ? 'Add bonus'
                : 'Manage bonuses',
          })}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            {dialogMode === 'add' ? (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ color: bonusColors.indigoDark, fontWeight: 700 }}
                >
                  {intl.formatMessage({
                    id: 'saved-bonuses-title',
                    defaultMessage: 'Saved bonuses',
                  })}
                </Typography>

                {renderDefinitionsState()}

                <Divider />

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: bonusColors.green,
                    '&:hover': { bgcolor: bonusColors.greenDark },
                  }}
                  onClick={addNewBonus}
                >
                  {intl.formatMessage({
                    id: 'saved-bonuses-new',
                    defaultMessage: 'New bonus',
                  })}
                </Button>

                <Button
                  variant="outlined"
                  sx={{
                    color: bonusColors.indigo,
                    borderColor: bonusColors.indigo,
                    '&:hover': {
                      bgcolor: bonusColors.indigoSoft,
                      borderColor: bonusColors.indigoDark,
                    },
                  }}
                  onClick={openManageMode}
                >
                  {intl.formatMessage({
                    id: 'saved-bonuses-manage',
                    defaultMessage: 'Manage bonuses',
                  })}
                </Button>
              </>
            ) : (
              <>
                <Tabs
                  value={definitionStatus}
                  onChange={(_event, value: DefinitionStatus) =>
                    setDefinitionStatus(value)
                  }
                  variant="fullWidth"
                  sx={{
                    '& .MuiTabs-indicator': {
                      bgcolor: bonusColors.indigoDark,
                      height: 3,
                      borderRadius: 3,
                    },
                    '& .MuiTab-root': {
                      color: 'text.secondary',
                      fontWeight: 600,
                    },
                    '& .MuiTab-root.Mui-selected': {
                      color: bonusColors.indigo,
                    },
                  }}
                >
                  <Tab
                    value="active"
                    label={intl.formatMessage({
                      id: 'saved-bonuses-active',
                      defaultMessage: 'Active',
                    })}
                  />
                  <Tab
                    value="inactive"
                    label={intl.formatMessage({
                      id: 'saved-bonuses-inactive',
                      defaultMessage: 'Inactive',
                    })}
                  />
                </Tabs>

                {renderDefinitionsState()}
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          {dialogMode === 'manage' && (
            <Button
              sx={{
                color: bonusColors.indigo,
                '&:hover': { bgcolor: bonusColors.indigoSoft },
              }}
              onClick={() => {
                setDialogMode('add');
                setDefinitionStatus('active');
              }}
            >
              {intl.formatMessage({
                id: 'saved-bonuses-back',
                defaultMessage: 'Back',
              })}
            </Button>
          )}

          <Button
            variant="contained"
            sx={{
              bgcolor: bonusColors.indigo,
              '&:hover': { bgcolor: bonusColors.indigoDark },
            }}
            onClick={() => setDialogOpen(false)}
          >
            {intl.formatMessage({
              id: 'close',
              defaultMessage: 'Close',
            })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
