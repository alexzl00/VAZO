import React from "react";
import { useState } from "react";
import type { ReactNode } from 'react'

// mui
import Grid from "@mui/material/Grid";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";

// project imports
import InfoText from "./InfoText";

// third party
import { InfoCircleOutlined } from "@ant-design/icons";

interface FormWithInfoProps {
  children: ReactNode;
  title: string;
  infoText: string;
}

/**
 * FormWithInfo
 * Wraps form content and explanatory text in a responsive layout:
 * - Desktop: form on left, info on right
 * - Mobile: stacked vertically
 */

interface FormWithInfoProps {
  children: React.ReactNode;
  title: string;
  infoText: string;
}

const FormWithInfo: React.FC<FormWithInfoProps> = ({ children, title, infoText }) => {
  const theme = useTheme();
  const [isTextShown, setIsTextShown] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleInfoClick = () => {
    setIsTextShown((prev) => !prev);
  };

  return (
    <Grid container spacing={2} direction="column">
      
      {/* Title row with Info button */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid >
            <Typography variant="h6" sx={{color: "#23326D", fontWeight: '700'}}>{title}</Typography>
          </Grid>
          <Grid >
            <IconButton
              onClick={handleInfoClick}
              sx={{ color: theme.palette.primary.main }}
            >
              <InfoCircleOutlined style={{ fontSize: 22 }} />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>

      {/* Form content */}
      <Grid size={{ xs: 12, md: 6 }}>
        {children}
      </Grid>

      {/* Explanatory info (render only after click) */}
      {isTextShown && (
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoText rawText={infoText} />
        </Grid>
      )}
    </Grid>
  );
};

export default FormWithInfo;
