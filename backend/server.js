import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import {
  connectDB,
  createOrder,
  getAllOrders,
  getDoneOrders,
  updateOrderStatus,
  deleteOrder,
  OrdersStats,
  updateOrderText,
  Chat,
  Order,
} from "./db.js";
import { getLocalAddress } from "./getLocalAddress.js";

import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import cron from "node-cron";
import axios from "axios";

const app = express();
// Указываем порт
const PORT = 3000;
const USERBOT_URL = process.env.USERBOT_URL || "http://127.0.0.1:4000";
// Подключение JSON-парсера для обработки тела запросов
app.use(express.json());
// Подключение CORS
const allowedOrigins = ["https://f663-185-103-255-138.ngrok-free.app"];
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//   }),
// );
app.use(cors());

const server = http.createServer(app);

// Создаём аналоги __dirname и __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self'");
  next();
});

connectDB();

const localIP = getLocalAddress();

// const wss = new WebSocketServer({ port: 3001 });
const wss = new WebSocketServer({ server });

const broadCast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
};

const notifyUserbotReady = async ({
  chatId,
  message,
  messageId,
  topicId,
  reaction = "👍",
}) => {
  try {
    await axios.post(`${USERBOT_URL}/order-ready`, {
      chatId,
      text: message,
      messageId,
      topicId,
      reaction,
    });
  } catch (error) {
    console.error("Failed to notify userbot about ready order:", error.response?.data || error.message);
  }
};

const sendMessageToTelegram = async (topicId, chatId, message) => {
  if (!message) return;
  try {
    await axios.post(`${USERBOT_URL}/send-message`, {
      chatId,
      text: message,
      topicId,
    });
  } catch (error) {
    console.error("Failed to send message via userbot:", error.response?.data || error.message);
  }
};


app.get("/orders", async (req, res) => {
  try {
    const orders = await getAllOrders();
    const sortedOrders = orders.sort((a, b) => {
      if (a.status === b.status) {
        return a.updatedAt - b.updatedAt;
      }
      return a.status === "ready" ? 1 : -1;
    });
    res.json(sortedOrders);
  } catch (err) {
    res.status(500).json({ error: "Failed to get orders" });
  }
});

app.get("/done-orders", async (req, res) => {
  try {
    const orders = await getDoneOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to get done orders" });
  }
});

app.post("/new-order", async (req, res) => {
  const { text, action, fromTelegram, ...tail } = req.body;
  console.log(`tail ${JSON.stringify(tail)}`);

  // Если нет текста, сразу отправляем ошибку
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  try {
    const ordersStats = await OrdersStats.findOne({});

    // Если нашли статистику заказов
    if (ordersStats) {
      let totalOrders = 0;

      // В зависимости от действия увеличиваем нужный счетчик
      if (action === "montazh") {
        const updatedStats = await OrdersStats.findOneAndUpdate(
          {},
          { $inc: { totalMontazh: 1 } },
          { new: true },
        );
        console.log(`updatedStats montazh ${updatedStats}`);

        totalOrders = updatedStats.totalMontazh;
      } else {
        const updatedStats = await OrdersStats.findOneAndUpdate(
          {},
          { $inc: { total: 1 } },
          { new: true },
        );
        console.log(`updatedStats total ${updatedStats}`);

        totalOrders = updatedStats.total;
      }

      // const newOrderId = totalOrders + 1;
      const newOrderId = totalOrders;

      const fullName = tail.fullName || "";

      // Формируем новый заказ
      const order = {
        id: newOrderId,
        status: "pending",
        fullName,
        fromTelegram,
        text,
        action,
        ...tail,
      };

      console.log(`order ${JSON.stringify(order)}`);

      try {
        // Создаем заказ в базе данных
        const newOrder = await createOrder(order);

        // Отправляем ответ клиенту
        res.status(201).json(newOrder);

        // Отправка сообщения через broadCast (она выполняется после отправки ответа)
        broadCast({ type: "new-order", order: newOrder });
      } catch (error) {
        console.error("Failed to create order on server", error);
        res.status(500).json({ error: "Failed to create order" });
      }
    } else {
      // Если не нашли статистику заказов
      res.status(404).json({ error: "Orders stats not found" });
    }
  } catch (err) {
    console.error("Error occurred while processing request", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// помечаем заказ выполненным
app.delete("/delete-order/:id/", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    await deleteOrder(id);
    broadCast({ type: "delete-order", id, userId });
    res.status(200).json({ id });
  } catch (err) {
    console.error("Failed to mark order as done", err);
    res.status(500).json({ error: "Failed to mark order as done" });
  }
});

app.patch("/order/:id/update", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const start = Date.now();

  if (id) {
    try {
      const newOrder = await Order.findOneAndUpdate(
        { _id: id },
        { status: "ready", updatedAt: Date.now() },
        { new: true },
      );

      console.log(`order fromTelegram: ${newOrder.fromTelegram}`);

      if (newOrder.fromTelegram) {
        const message =
          newOrder.action === "montazh"
            ? `🛠 Монтаж собран! #${newOrder.id}`
            : `✅ Заказ собран! #${newOrder.id}`;
        await notifyUserbotReady({
          chatId: newOrder.chatId,
          message,
          messageId: newOrder.messageId,
          topicId: newOrder.topicId,
          reaction: newOrder.action === "montazh" ? "🛠" : "👍",
        });
      }
      console.log(
        `updateOrderStatus on server executed in ${Date.now() - start} ms`,
      );
      broadCast({ type: "update-order", order: newOrder, userId });
      res.status(200).json(newOrder);
      // res.status(200).json(newOrder);
    } catch (err) {
      console.log("Failed to update order", err);
    }
  }
});

app.patch("/update-order/:id/text", async (req, res) => {
  const { id } = req.params;
  const { text, userId } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const updatedOrder = await updateOrderText(id, text);
    res.status(200).json(updatedOrder);
    // Отправляем сообщение клиентам через WebSocket
    broadCast({
      type: "update-order-text",
      order: updatedOrder,
      userId,
    });
  } catch (err) {
    console.log("Failed to update order text", err);
    res.status(500).json({ error: "Failed to update order text" });
  }
});

//сообщение в телегу
app.post("/send-message", async (req, res) => {
  const { topicId, chatId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    await sendMessageToTelegram(topicId, chatId, message);
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Failed to send message on server", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

//запрос всех чатов с chatTitle
app.get("/chats", async (req, res) => {
  try {
    const chats = await Chat.find({ chatTitle: { $exists: true } });
    res.status(200).json(chats);
  } catch (error) {
    console.error("Failed to get chats", error);
    res.status(500).json({ error: "Failed to get chats" });
  }
});

//запрос всех курьеров
const getCurrentMonth = () => {
  const months = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];
  return months[new Date().getMonth()];
};

// async function testCron() {
//   try {
//     const currentMonth = getCurrentMonth();

//     // Получаем текущую запись
//     let stats = await OrdersStats.findOne();
//     console.log(`currentMonth: ${currentMonth} month: ${stats.month}`);
//     if (stats) {
//       // Если месяц совпадает, ничего не делаем
//       if (stats.month === currentMonth) {
//         console.log(`Месяц ${currentMonth} уже установлен. Ничего не делаем.`);
//         return;
//       } else {
//         // Если месяц изменился — сбрасываем данные
//         stats.total = 0;
//         stats.totalMontazh = 0;
//         stats.month = currentMonth;
//         await stats.save();

//         console.log(
//           `Обновлен месяц на ${currentMonth}, сброшены total и totalMontazh.`,
//         );
//       }
//     } else {
//       // Если записи нет, создаём новую
//       await OrdersStats.create({
//         month: currentMonth,
//         total: 0,
//         totalMontazh: 0,
//       });
//       console.log(`Создана новая запись для месяца: ${currentMonth}`);
//     }
//   } catch (error) {
//     console.error("Ошибка при обновлении месяца:", error);
//   }
// }

// testCron();

cron.schedule("0 1 * * *", async () => {
  try {
    const currentMonth = getCurrentMonth();

    // Получаем текущую запись
    let stats = await OrdersStats.findOne();
    console.log(`currentMonth: ${currentMonth} month: ${stats.month}`);
    if (stats) {
      // Если месяц совпадает, ничего не делаем
      if (stats.month === currentMonth) {
        console.log(`Месяц ${currentMonth} уже установлен. Ничего не делаем.`);
        return;
      } else {
        // Если месяц изменился — сбрасываем данные
        stats.total = 0;
        stats.totalMontazh = 0;
        stats.month = currentMonth;
        await stats.save();

        console.log(
          `Обновлен месяц на ${currentMonth}, сброшены total и totalMontazh.`,
        );
      }
    } else {
      // Если записи нет, создаём новую
      await OrdersStats.create({
        month: currentMonth,
        total: 0,
        totalMontazh: 0,
      });
      console.log(`Создана новая запись для месяца: ${currentMonth}`);
    }
  } catch (error) {
    console.error("Ошибка при обновлении месяца:", error);
  }
});

let alreadySent = false;

cron.schedule("00 10 * * 1,4", async () => {
  if (alreadySent) return;

  alreadySent = true;
  setTimeout(() => {
    alreadySent = false;
  }, 60 * 1000); // сброс через минуту

  const payload = {
    text: "Посчитать готовое оборудование",
    userId: "auto-cron",
    fromTelegram: false,
    action: "zakaz",
    fullName: "Чиназес",
  };

  try {
    const response = await axios.post(
      "http://localhost:3000/new-order",
      payload,
    );
    console.log("Авто-заказ отправлен:", response.data);
  } catch (error) {
    console.error("Ошибка при создании авто-заказа:", error.message);
  }
});

let alreadySent16 = false;

cron.schedule("00 16 * * *", async () => {
  if (alreadySent16) return;

  alreadySent16 = true;
  setTimeout(() => {
    alreadySent16 = false;
  }, 60 * 1000); // сброс через минуту

  const payload = {
    text: "Отнести ваську из отк акты",
    userId: "auto-cron",
    fromTelegram: false,
    action: "zakaz",
    fullName: "Чиназес",
  };

  try {
    const response = await axios.post(
      "http://localhost:3000/new-order",
      payload,
    );
    console.log("Авто-заказ (16:00) отправлен:", response.data);
  } catch (error) {
    console.error("Ошибка при создании авто-заказа (16:00):", error.message);
  }
});


// app.listen(PORT, () => {
//   console.log(`Server running on port http://${localIP}:${PORT}`);
// });
server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// server.on("upgrade", (req, socket, head) => {
//   wss.handleUpgrade(req, socket, head, (ws) => {
//     wss.emit("connection", ws, req);
//   });
// });

