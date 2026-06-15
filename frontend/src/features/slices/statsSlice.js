import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { baseUrl } from "./ordersThunks";

export const fetchStats = createAsyncThunk("stats/fetch", async () => {
  const res = await fetch(`${baseUrl}/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
});

const statsSlice = createSlice({
  name: "stats",
  initialState: { total: 0, totalMontazh: 0, month: "" },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchStats.fulfilled, (state, action) => {
      state.total = action.payload.total;
      state.totalMontazh = action.payload.totalMontazh;
      state.month = action.payload.month;
    });
  },
});

export const selectStats = (state) => state.stats;
export default statsSlice.reducer;
