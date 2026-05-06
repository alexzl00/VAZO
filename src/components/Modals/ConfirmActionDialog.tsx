import React from 'react';

// mui imports
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircleOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import { FormattedMessage } from 'react-intl';

export type ConfirmDialogVariant = 'default' | 'danger' | 'success' | 'info';

export type DialogConfig = {
  variant: ConfirmDialogVariant;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmText: React.ReactNode;
  form?: boolean;
  extraContent?: React.ReactNode;
  getAction: (...args: any[]) => (data?: Record<string, FormDataEntryValue>) => void; // data are the values from form inside ActionDialog
};

interface ConfirmActionDialogProps {
  open: boolean;
  onConfirm: (data?: Record<string, FormDataEntryValue>) => void;
  onCancel: () => void;

  /** Content */
  title?: React.ReactNode;
  message?: React.ReactNode;

  form?: boolean;
  extraContent?: React.ReactNode;

  /** Buttons */
  confirmText?: React.ReactNode;
  cancelText?: React.ReactNode;

  /** Icons (Ant Design) */
  icon?: React.ReactNode;
  confirmIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;

  /** Visual variant for easy theming */
  variant?: ConfirmDialogVariant;

  /** Optional: customize styles via sx props */
  dialogSx?: object;
  confirmButtonSx?: object;
  cancelButtonSx?: object;
}

const palette = {
  accent: '#5ddfcc',
  textDark: '#1e2a47',
};

const getVariantStyles = (variant: ConfirmDialogVariant) => {
  switch (variant) {
    case 'danger':
      return {
        iconColor: '#d9363e',
        confirmBg: alpha('#d9363e', 0.18),
        confirmBorder: alpha('#d9363e', 0.9),
        confirmHoverBg: '#d9363e',
        confirmHoverText: '#fff',
      };
    case 'success':
      return {
        iconColor: palette.accent,
        confirmBg: alpha(palette.accent, 0.25),
        confirmBorder: alpha(palette.accent, 0.9),
        confirmHoverBg: palette.accent,
        confirmHoverText: palette.textDark,
      };
    case 'info':
      return {
        iconColor: '#1677ff',
        confirmBg: alpha('#1677ff', 0.18),
        confirmBorder: alpha('#1677ff', 0.9),
        confirmHoverBg: '#1677ff',
        confirmHoverText: '#fff',
      };
    default:
      return {
        iconColor: palette.accent,
        confirmBg: alpha(palette.accent, 0.25),
        confirmBorder: alpha(palette.accent, 0.9),
        confirmHoverBg: palette.accent,
        confirmHoverText: palette.textDark,
      };
  }
};

const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  open,
  onConfirm,
  onCancel,

  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',

  form = false,
  extraContent,

  confirmText = <FormattedMessage id="Yes" />,
  cancelText = <FormattedMessage id="no" />,

  icon,
  confirmIcon,
  cancelIcon,

  variant = 'default',

  dialogSx,
  confirmButtonSx,
  cancelButtonSx,
}) => {
  const v = getVariantStyles(variant);

  const ContentWrapper = form ? 'form' : React.Fragment;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    onConfirm(data);
  };


  return (
    <Dialog
      open={open}
      onClose={onCancel}
      data-test='confirm-action-dialog'
      PaperProps={{
        sx: {
          borderRadius: 4,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          backgroundColor: alpha('#ffffff', 0.95),
          ...dialogSx,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          fontWeight: 800,
          color: palette.textDark,
        }}
      >
        {icon ?? <ExclamationCircleOutlined style={{ color: v.iconColor, fontSize: 22 }} />}
        {title}
      </DialogTitle>
      <ContentWrapper {...(form ? { onSubmit: handleSubmit } : {})}>
        <DialogContent sx={{ color: alpha(palette.textDark, 0.9) }}>
          {typeof message === 'string' ? <Typography>{message}</Typography> : message}
          {extraContent && <div style={{ marginTop: 16 }}>{extraContent}</div>}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            startIcon={cancelIcon ?? <CloseOutlined />}
            data-test='cancel-dialog-button'
            sx={{
              border: `2px solid ${alpha(v.confirmBorder as string, 0.75)}`, // reuse variant color lightly
              color: alpha(v.confirmBorder as string, 0.85),
              borderRadius: '24px',
              fontWeight: 700,
              ':hover': {
                borderColor: v.confirmBorder,
                color: v.confirmBorder,
              },
              ...cancelButtonSx,
            }}
          >
            {cancelText}
          </Button>

          <Button
            data-test='confirm-dialog-button'
            variant="contained"
            type={form ? 'submit' : 'button'}
            onClick={!form ? () => onConfirm() : undefined}
            startIcon={confirmIcon ?? <CheckCircleOutlined />}
            sx={{
              backgroundColor: v.confirmBg,
              color: palette.textDark,
              border: `2px solid ${v.confirmBorder}`,
              borderRadius: '24px',
              fontWeight: 700,
              ':hover': {
                backgroundColor: v.confirmHoverBg,
                color: v.confirmHoverText,
                fontWeight: 700,
              },
              ...confirmButtonSx,
            }}
          >
            {confirmText}
          </Button>
        </DialogActions>
      </ContentWrapper>
    </Dialog>
  );
};

export default ConfirmActionDialog;

