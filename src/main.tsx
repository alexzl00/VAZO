import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import theme from "./overrides/theme";

import Translations from "./components/Translations";

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