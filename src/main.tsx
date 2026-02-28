import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import theme from "./overrides/theme";

import "./styles.css";

import Translations from "./components/Translations";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";

import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/700.css';


createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
    <Translations>
      <StrictMode>
        <CssBaseline />
        <RouterProvider router={router} />
      </StrictMode>
    </Translations>
  </ThemeProvider>
);