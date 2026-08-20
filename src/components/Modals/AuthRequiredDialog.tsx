import {
  alpha,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from "@mui/material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";

const palette = {
  accent: "#5ddfcc",
  textDark: "#1e2a47",
};

interface AuthRequiredDialogProps {
  open: boolean;
  onClose: () => void;
}

const AuthRequiredDialog = ({
  open,
  onClose,
}: AuthRequiredDialogProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 450,
          maxWidth: "calc(100% - 32px)",
          borderRadius: 4,
          backdropFilter: "blur(8px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
          backgroundColor: alpha("#ffffff", 0.96),
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 3,
          pt: 3,
          pb: 1.5,
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 800,
          fontSize: 21,
          color: palette.textDark,
        }}
      >
        <LockOutlinedIcon
          sx={{
            color: palette.accent,
            fontSize: 24,
          }}
        />

        <FormattedMessage id="navbar-auth-required-title" />
      </DialogTitle>

      <DialogContent
        sx={{
          px: 3,
          pt: "8px !important",
        }}
      >
        <DialogContentText
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: 15,
            lineHeight: 1.7,
            color: alpha(palette.textDark, 0.72),
          }}
        >
          <FormattedMessage id="navbar-auth-required-description" />
        </DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1.5,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1}
          sx={{
            width: "100%",
            justifyContent: "flex-end",

            "& .MuiButton-root": {
              fontFamily: "Montserrat, sans-serif",
              textTransform: "none",
              minHeight: 40,
            },
          }}
        >
          <Button
            variant="text"
            onClick={onClose}
            startIcon={<CloseOutlinedIcon />}
            sx={{
              color: alpha(palette.textDark, 0.6),
              borderRadius: "24px",
              fontWeight: 600,

              "&:hover": {
                backgroundColor: alpha(palette.textDark, 0.05),
                color: palette.textDark,
              },
            }}
          >
            <FormattedMessage id="navbar-auth-required-cancel" />
          </Button>

          <Button
            variant="outlined"
            onClick={() => handleNavigate("/signup")}
            startIcon={<PersonAddAltOutlinedIcon />}
            sx={{
              border: `2px solid ${alpha(palette.accent, 0.7)}`,
              color: palette.textDark,
              borderRadius: "24px",
              fontWeight: 700,

              "&:hover": {
                border: `2px solid ${palette.accent}`,
                backgroundColor: alpha(palette.accent, 0.12),
              },
            }}
          >
            <FormattedMessage id="header-sign-up" />
          </Button>

          <Button
            variant="contained"
            onClick={() => handleNavigate("/login")}
            startIcon={<LoginOutlinedIcon />}
            sx={{
              backgroundColor: alpha(palette.accent, 0.25),
              color: palette.textDark,
              border: `2px solid ${palette.accent}`,
              borderRadius: "24px",
              fontWeight: 700,
              boxShadow: "none",

              "&:hover": {
                backgroundColor: palette.accent,
                boxShadow: "none",
              },
            }}
          >
            <FormattedMessage id="header-login" />
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default AuthRequiredDialog;