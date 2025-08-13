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
    enum: ["pending", "ready"],
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
  userName: {
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
    type: String,
    required: false,
    default: "",
  },
  fromTelegram: {
    type: Boolean,
    required: false,
    default: false,
  },
  userId: {
    type: String,
    required: false,
    default: "",
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

export const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: false,
    default: "",
  },
  lastName: {
    type: String,
    required: false,
  },
  fullName: {
    type: String,
    required: false,
    default: "",
  },
  userName: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    required: false,
    default: "courier" || "admin",
  },
});

export const User = mongoose.model("User", userSchema);

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

//создание юзера
export const createOrGetUser = async (userData) => {
  const { userId, firstName, lastName, fullName, userName } = userData;

  try {
    let existngUser = await User.findOne({ userId });
    if (!existngUser) {
      existngUser = new User({
        userId,
        firstName,
        lastName,
        fullName,
        userName,
      });
      await existngUser.save();
    } else if (!existngUser.userName && userName) {
      existngUser.userName = userName;
      await existngUser.save();
    }
    return existngUser;
  } catch (error) {
    console.error("Failed to create or get user:", error);
    throw error;
  }
};

//все юзеры
export const getAllusers = async () => {
  try {
    const users = await User.find();
    return users;
  } catch (err) {
    console.error("Failed to retrieve users in db", err);
    throw err;
  }
};

// Найти пользователя по userId
export const getUserById = async (userId) => {
  try {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error(`User with userId ${userId} not found`);
    }
    return user;
  } catch (err) {
    console.error("Failed to retrieve user by userId in db", err);
    throw err;
  }
};

export const createOrder = async (orderData) => {
  try {
    const {
      chatId,
      chatTitle,
      topicId,
      userId,
      firstName,
      lastName,
      fromTelegram,
      ...rest
    } = orderData;
    await createOrGetChat(chatId, chatTitle, topicId);
    // const user = await createOrGetUser(userId, firstName, lastName);
    // if (fromTelegram) await createOrGetUser(userId, firstName, lastName);
    if (fromTelegram) await createOrGetUser(orderData);

    const newOrder = new Order({
      ...rest,
      chatId,
      userId,
      firstName,
      lastName,
      chatTitle,
      fromTelegram,
      ...rest,
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
    const orders = await Order.find();
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
    const order = await Order.findOneAndDelete({ id: orderId });

    if (!order) {
      throw new Error(`Order with id ${orderId} not found`);
    }

    console.log("Order deleted in db:", order.id);
    return order;
  } catch (err) {
    console.error("Failed to delete order", err);
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
