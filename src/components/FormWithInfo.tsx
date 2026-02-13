import React from "react";
import type { ReactNode } from 'react'

// mui
import Grid from "@mui/material/Grid";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useTheme } from "@mui/material/styles";

// project imports
import InfoText from "./InfoText";

interface FormWithInfoProps {
  children: ReactNode; // Your form content goes here
  infoText: string;    // The explanatory text
}

/**
 * FormWithInfo
 * Wraps form content and explanatory text in a responsive layout:
 * - Desktop: form on left, info on right
 * - Mobile: stacked vertically
 */
const FormWithInfo: React.FC<FormWithInfoProps> = ({ children, infoText }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Grid container spacing={2} direction={isMobile ? "column" : "row"}>
      {/* Form content */}
      <Grid size={{ xs: 12, md: 6}}>
        {children}
      </Grid>

      {/* Explanatory info */}
      <Grid size={{ xs: 12, md: 6}}>
        <InfoText rawText={infoText}/>
      </Grid>
    </Grid>
  );
};

export default FormWithInfo;
