import { createAsyncThunk } from "@reduxjs/toolkit";
import { selectUserId } from "./userSlice";

export const LOCAL_IP = import.meta.env.VITE_LOCAL_IP ?? "localhost";
export const NGROK = import.meta.env.VITE_NGROK;
const PORT = 3000;
export const baseUrl = `http://${LOCAL_IP}:${PORT}`;
// export const baseUrl = `https://${NGROK}`;
console.log(`baseUrl: ${baseUrl}`);

export const sendMessgageToTelegram = async (topicId, chatId, message) => {
  console.log(topicId, chatId, message);

  try {
    const response = await fetch(`${baseUrl}/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, chatId, message }),
    });

    if (!response) throw new Error("Error response", response.status);
    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error("Failed to send message", error);
  }
};

export const fetchChats = async () => {
  try {
    const response = await fetch(`${baseUrl}/chats`, {
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to get chats", error);
  }
};

// Функция для получения всех заказов
export const fetchOrders = createAsyncThunk("orders/fetchOrders", async () => {
  const response = await fetch(`${baseUrl}/orders`);
  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }
  return response.json();
});

// Функция для получения завершенных заказов
export const fetchDoneOrders = createAsyncThunk("orders/fetchDoneOrders", async () => {
  const response = await fetch(`${baseUrl}/done-orders`);
  if (!response.ok) {
    throw new Error("Failed to fetch done orders");
  }
  return response.json();
});

// Функция для добавления нового заказа
export const addOrderApi = createAsyncThunk(
  "orders/addOrder",
  async ({ text, fullName }, thunkAPI) => {
    const userId = selectUserId(thunkAPI.getState());

    const response = await fetch(`${baseUrl}/new-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fullName, userId }),
    });
    if (!response.ok) {
      throw new Error("Failed to add order");
    }
    return response.json();
  }
);

// Функция для удаления заказа
export const deleteOrderApi = createAsyncThunk(
  "orders/deleteOrder",
  async (_id, thunkAPI) => {
    const userId = selectUserId(thunkAPI.getState());

    const response = await fetch(`${baseUrl}/delete-order/${_id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error("Failed to delete order");
    }
    return _id;
  }
);

// Функция для обновления заказа
export const updateOrderStatusApi = createAsyncThunk(
  "orders/updateOrder",
  async (_id, thunkAPI) => {
    const userId = selectUserId(thunkAPI.getState());
    const response = await fetch(`${baseUrl}/order/${_id}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error("Failed to update order");
    }
    return response.json();
  }
);

// Функция для обновления текста заказа
export const updateOrderTextApi = createAsyncThunk(
  "orders/updateOrderText",
  async ({ id, text }, thunkAPI) => {
    const userId = selectUserId(thunkAPI.getState());
    const response = await fetch(`${baseUrl}/update-order/${id}/text`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, userId }),
    });
    if (!response.ok) {
      throw new Error("Failed to update order text");
    }
    return response.json();
  }
);
