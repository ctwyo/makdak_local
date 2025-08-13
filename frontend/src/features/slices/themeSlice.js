import { createSlice } from "@reduxjs/toolkit";

const getSystemTheme = () => {
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  return prefersDarkMode ? "dark" : "light";
};

export const themeSlice = createSlice({
  name: "theme",
  initialState: {
    mode: localStorage.getItem("themeMode") || getSystemTheme(),
  },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", state.mode);
    },
    setTheme: (state, action) => {
      state.mode === action.payload;
      localStorage.setItem("themeMode", state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
