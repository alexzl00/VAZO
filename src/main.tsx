import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { SnackbarProvider } from "notistack";

import theme from "./overrides/theme";

import Translations from "./components/Translations";

import { AuthProvider } from "./auth/AuthContext";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
    <SnackbarProvider maxSnack={3} autoHideDuration={3000} anchorOrigin={{ vertical: "bottom", horizontal: "right"}}>
      <Translations>
        <AuthProvider>
          <StrictMode>
            <CssBaseline />
            <RouterProvider router={router} />
          </StrictMode>
        </AuthProvider>
      </Translations>
    </SnackbarProvider>
  </ThemeProvider>
);