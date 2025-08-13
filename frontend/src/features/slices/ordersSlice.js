import { createSlice } from "@reduxjs/toolkit";
import {
  fetchOrders,
  addOrderApi,
  deleteOrderApi,
  updateOrderStatusApi,
  updateOrderTextApi,
} from "./ordersThunks";

const initialState = {
  orders: [], // изменено на ordersList
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    addOrderToState: (state, action) => {
      state.orders.push(action.payload);
    },
    removeOrderFromState: (state, action) => {
      const id = action.payload;
      state.orders = state.orders.filter((order) => order._id !== id);
    },
    updateOrderStatus: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.orders.findIndex(
        (order) => order.id === updatedOrder.id
      );
      if (index !== -1) {
        state.orders[index] = updatedOrder;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateOrderText: (state, action) => {
      const { id, text } = action.payload;
      const index = state.orders.findIndex((order) => order.id === id);
      if (index !== -1) {
        state.orders[index].text = text;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(addOrderApi.pending, (state) => {
        state.loading = true;
      })
      .addCase(addOrderApi.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.push(action.payload);
      })
      .addCase(addOrderApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(deleteOrderApi.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteOrderApi.fulfilled, (state, action) => {
        const _id = action.payload;
        state.loading = false;
        state.orders = state.orders.filter((order) => order._id !== _id);
      })
      .addCase(deleteOrderApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(updateOrderStatusApi.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOrderStatusApi.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex(
          (order) => order._id === action.payload._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(updateOrderStatusApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(updateOrderTextApi.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOrderTextApi.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index].text = action.payload.text;
        }
      })
      .addCase(updateOrderTextApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setOrders,
  addOrderToState,
  removeOrderFromState,
  updateOrderStatus,
  setLoading,
  setError,
  updateOrderText,
} = ordersSlice.actions;

export const selectOrders = (state) => state.ordersStore.orders; // исправлено
export const selectOrdersLoading = (state) => state.ordersStore.loading;
export const selectOrdersError = (state) => state.ordersStore.error;

export default ordersSlice.reducer;
