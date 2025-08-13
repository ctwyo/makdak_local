import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./features/store/store.js";
import { BrowserRouter } from "react-router";
import AppRoutes from "./routes";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React, { useEffect } from "react";
import App from "./App.jsx";
import { setTheme } from "./features/slices/themeSlice.js";

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      background: {
        default: mode === "light" ? "#ffffff" : "#121212",
        paper: mode === "light" ? "#f5f5f5" : "#1c1c1c",
      },
    },
  });

const Root = () => {
  const mode = useSelector((state) => state.theme.mode);
  const dispatch = useDispatch();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e) => {
      if (!localStorage.getItem("themeMode")) {
        const newTheme = e.matches ? "dark" : "light";
        dispatch(setTheme(newTheme));
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [dispatch]);

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  );
};

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <Root />
  </Provider>
);
