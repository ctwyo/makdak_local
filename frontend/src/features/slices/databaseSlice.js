import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { baseUrl } from "./ordersThunks";

export const updateUserApi = createAsyncThunk(
  "database/updateUser",
  async ({ id, data }) => {
    try {
      const response = await fetch(`${baseUrl}/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update user response");
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to update user", error);
    }
  }
);

export const deleteUserApi = createAsyncThunk(
  "database/deleteUser",
  async (id) => {
    try {
      const response = await fetch(`${baseUrl}/users/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to delete user, response");
      return id;
      // const result = await response.json();
      // return result;
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  }
);

export const fetchCouriersApi = createAsyncThunk(
  "database/fetchCouriers",
  async () => {
    try {
      const response = await fetch(`${baseUrl}/couriers`, {
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to get couriers", error);
      throw error;
    }
  }
);

const databaseSlice = createSlice({
  name: "database",
  initialState: {
    couriers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCouriersApi.fulfilled, (state, action) => {
        state.couriers = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCouriersApi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCouriersApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateUserApi.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const index = state.couriers.findIndex(
          (user) => user.userId === updatedUser.userId
        );
        if (index !== -1) {
          state.couriers[index] = updatedUser;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateUserApi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteUserApi.fulfilled, (state, action) => {
        const deletedUserId = action.payload;
        state.couriers = state.couriers.filter(
          (user) => user.userId !== deletedUserId
        );
        state.loading = false;
        state.error = null;
      });
  },
});

export default databaseSlice.reducer;
