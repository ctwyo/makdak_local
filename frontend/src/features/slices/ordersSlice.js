import { createSlice } from "@reduxjs/toolkit";
import {
  fetchOrders,
  fetchDoneOrders,
  addOrderApi,
  deleteOrderApi,
  updateOrderStatusApi,
  updateOrderTextApi,
} from "./ordersThunks";

const isActiveOrder = (order) =>
  order?.status === "pending" || order?.status === "ready";

const initialState = {
  orders: [], // активные заказы (pending, ready)
  doneOrders: [], // завершенные заказы (done)
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload.filter(isActiveOrder);
    },
    addOrderToState: (state, action) => {
      if (isActiveOrder(action.payload)) {
        state.orders.push(action.payload);
      }
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
        if (isActiveOrder(updatedOrder)) {
          state.orders[index] = updatedOrder;
        } else {
          state.orders.splice(index, 1);
        }
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
        state.orders = action.payload.filter(isActiveOrder);
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(fetchDoneOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDoneOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.doneOrders = action.payload;
      })
      .addCase(fetchDoneOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(addOrderApi.pending, (state) => {
        state.loading = true;
      })
      .addCase(addOrderApi.fulfilled, (state, action) => {
        state.loading = false;
        if (isActiveOrder(action.payload)) {
          state.orders.push(action.payload);
        }
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
          if (isActiveOrder(action.payload)) {
            state.orders[index] = action.payload;
          } else {
            state.orders.splice(index, 1);
          }
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
export const selectDoneOrders = (state) => state.ordersStore.doneOrders;
export const selectOrdersLoading = (state) => state.ordersStore.loading;
export const selectOrdersError = (state) => state.ordersStore.error;

export default ordersSlice.reducer;
