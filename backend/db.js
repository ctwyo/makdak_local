import { clear } from "console";
import mongoose from "mongoose";
import { stringify } from "querystring";

export const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/tealpos-orders", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};

const ordersStatsSchema = new mongoose.Schema({
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  totalMontazh: {
    type: Number,
    required: false,
    default: 0,
  },
  month: {
    type: String,
    required: false,
  }
});

export const OrdersStats = mongoose.model(
  "OrdersStats",
  ordersStatsSchema,
  "orderstats",
);

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: false,
    // unique: true,
  },
  chatTitle: {
    type: String,
    required: false,
  },
  topicId: {
    type: Number,
    required: false,
    unique: true,
  },
});

export const Chat = mongoose.model("Chat", chatSchema);

const orderSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "ready", "done"],
    default: "pending",
  },
  text: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  chatId: {
    type: String,
    required: false,
    default: "",
  },
  action: {
    type: String,
    default: "",
  },
  messageId: {
    type: Number,
    required: false,
    default: 0,
  },
  fromTelegram: {
    type: Boolean,
    required: false,
    default: false,
  },
  chatTitle: {
    type: String,
    required: false,
    default: "",
  },
  fullName: {
    type: String,
    required: false,
    default: "",
  },
});

export const Order = mongoose.model("Order", orderSchema);

export const createOrGetChat = async (chatId, chatTitle, topicId) => {
  if (!chatTitle) {
    return null;
  }
  try {
    // let chat = await Chat.findOne({ chatId });
    let chat = await Chat.findOne({ topicId });
    if (!chat) {
      chat = new Chat({ chatId, chatTitle, topicId });
      console.log(`new chat ${chat} in db`);
      await chat.save();
    }
    return chat;
  } catch (error) {
    console.error("Failed to create or get chat", error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const {
      chatId,
      chatTitle,
      topicId,
      firstName,
      lastName,
      fromTelegram,
      ...rest
    } = orderData;
    await createOrGetChat(chatId, chatTitle, topicId);
    const newOrder = new Order({
      ...rest,
      chatId,
      firstName,
      lastName,
      chatTitle,
      fromTelegram,
      topicId,
    });

    await newOrder.save();
    return newOrder;
  } catch (error) {
    console.error("Failed to create order:", error);
    throw error;
  }
};

export const getAllOrders = async () => {
  try {
    const orders = await Order.find({ status: { $ne: "done" } });
    return orders;
  } catch (err) {
    console.error("Failed to retrieve orders in db", err);
    throw err;
  }
};

export const updateOrderStatus = async (_id) => {
  const start = Date.now();
  try {
    const order = await Order.findOneAndUpdate(
      { _id: _id },
      { status: "ready", updatedAt: Date.now() },
      { new: true },
    );

    if (!order) {
      throw new Error(`Order with id ${_id} not found`);
    }

    console.log("Order updated in db:", order.id);
    console.log(`updateOrderStatus in DB executed in ${Date.now() - start} ms`);
    return order;
  } catch (err) {
    console.error("Failed to update order status in db", err);
    throw err;
  }
};

export const deleteOrder = async (orderId) => {
  try {
    const idString = String(orderId);
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idString);
    const filter = isObjectId ? { _id: orderId } : { id: orderId };
    const order = await Order.findOneAndUpdate(
      filter,
      { status: "done", updatedAt: Date.now() },
      { new: true },
    );

    if (!order) {
      throw new Error(`Order with id ${orderId} not found`);
    }

    console.log("Order marked as done in db:", order.id);
    return order;
  } catch (err) {
    console.error("Failed to mark order as done", err);
    throw err;
  }
};

export const updateOrderText = async (id, newText) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: id },
      { text: newText, updatedAt: Date.now() },
      { new: true },
    );

    if (!order) {
      throw new Error(`Order with id ${id} not found in db`);
    }

    console.log("Order text updated in db:", order.id, order.text);
    return order;
  } catch (err) {
    console.error("Failed to update order text", err);
    throw err;
  }
};


