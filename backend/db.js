import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "orders.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS orderstats (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    total        INTEGER NOT NULL DEFAULT 0,
    totalMontazh INTEGER NOT NULL DEFAULT 0,
    month        TEXT    NOT NULL DEFAULT ''
  );
  INSERT OR IGNORE INTO orderstats (id, total, totalMontazh, month) VALUES (1, 0, 0, '');

  CREATE TABLE IF NOT EXISTS chats (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    chatId    TEXT NOT NULL DEFAULT '',
    chatTitle TEXT NOT NULL DEFAULT '',
    topicId   INTEGER UNIQUE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY,
    status       TEXT    NOT NULL DEFAULT 'pending',
    text         TEXT    NOT NULL DEFAULT '',
    firstName    TEXT    NOT NULL DEFAULT '',
    lastName     TEXT    NOT NULL DEFAULT '',
    userName     TEXT    NOT NULL DEFAULT '',
    updatedAt    INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    chatId       TEXT    NOT NULL DEFAULT '',
    action       TEXT    NOT NULL DEFAULT '',
    messageId    TEXT    NOT NULL DEFAULT '',
    fromTelegram INTEGER NOT NULL DEFAULT 0,
    userId       TEXT    NOT NULL DEFAULT '',
    chatTitle    TEXT    NOT NULL DEFAULT '',
    fullName     TEXT    NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    userId    TEXT NOT NULL UNIQUE,
    firstName TEXT NOT NULL DEFAULT '',
    lastName  TEXT NOT NULL DEFAULT '',
    fullName  TEXT NOT NULL DEFAULT '',
    userName  TEXT NOT NULL DEFAULT '',
    role      TEXT NOT NULL DEFAULT 'courier'
  );
`);

const toOrder = (row) => {
  if (!row) return null;
  return { ...row, fromTelegram: !!row.fromTelegram };
};

export const connectDB = async () => {
  console.log("SQLite connected");
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getStats = () => {
  return db.prepare("SELECT * FROM orderstats WHERE id = 1").get();
};

export const incrementStats = db.transaction((field) => {
  db.prepare(`UPDATE orderstats SET ${field} = ${field} + 1 WHERE id = 1`).run();
  return db.prepare("SELECT * FROM orderstats WHERE id = 1").get();
});

export const resetMonthlyStats = (newMonth) => {
  db.prepare(
    "UPDATE orderstats SET total = 0, totalMontazh = 0, month = ? WHERE id = 1"
  ).run(newMonth);
};

// ─── Chats ────────────────────────────────────────────────────────────────────

export const createOrGetChat = async (chatId, chatTitle, topicId) => {
  if (!chatTitle) return null;
  try {
    const existing = db
      .prepare("SELECT * FROM chats WHERE topicId = ?")
      .get(topicId);
    if (!existing) {
      db.prepare(
        "INSERT INTO chats (chatId, chatTitle, topicId) VALUES (?, ?, ?)"
      ).run(chatId ?? "", chatTitle, topicId ?? null);
      console.log(`new chat ${chatTitle} in db`);
    }
    return db.prepare("SELECT * FROM chats WHERE topicId = ?").get(topicId);
  } catch (error) {
    console.error("Failed to create or get chat", error);
    throw error;
  }
};

export const getAllChats = () => {
  return db
    .prepare("SELECT * FROM chats WHERE chatTitle != '' AND chatTitle IS NOT NULL")
    .all();
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const createOrGetUser = async (userData) => {
  const { userId, firstName, lastName, fullName, userName } = userData;
  try {
    const existing = db
      .prepare("SELECT * FROM users WHERE userId = ?")
      .get(userId);

    if (!existing) {
      db.prepare(
        "INSERT INTO users (userId, firstName, lastName, fullName, userName) VALUES (?, ?, ?, ?, ?)"
      ).run(
        userId,
        firstName ?? "",
        lastName ?? "",
        fullName ?? "",
        userName ?? ""
      );
    } else if (!existing.userName && userName) {
      db.prepare("UPDATE users SET userName = ? WHERE userId = ?").run(
        userName,
        userId
      );
    }

    return db.prepare("SELECT * FROM users WHERE userId = ?").get(userId);
  } catch (error) {
    console.error("Failed to create or get user:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const user = db
      .prepare("SELECT * FROM users WHERE userId = ?")
      .get(userId);
    if (!user) throw new Error(`User with userId ${userId} not found`);
    return user;
  } catch (err) {
    console.error("Failed to retrieve user by userId in db", err);
    throw err;
  }
};

export const findUserById = (userId) => {
  return db.prepare("SELECT * FROM users WHERE userId = ?").get(userId) ?? null;
};

export const getAllusers = async () => {
  try {
    return db.prepare("SELECT * FROM users").all();
  } catch (err) {
    console.error("Failed to retrieve users in db", err);
    throw err;
  }
};

export const updateUser = (userId, data) => {
  const allowed = ["firstName", "lastName", "fullName", "userName", "role"];
  const keys = Object.keys(data).filter((k) => allowed.includes(k));
  if (keys.length === 0) return null;
  const set = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => data[k]);
  db.prepare(`UPDATE users SET ${set} WHERE userId = ?`).run(...values, userId);
  return db.prepare("SELECT * FROM users WHERE userId = ?").get(userId);
};

export const deleteUser = (userId) => {
  const user = db
    .prepare("SELECT * FROM users WHERE userId = ?")
    .get(userId);
  if (!user) return null;
  db.prepare("DELETE FROM users WHERE userId = ?").run(userId);
  return user;
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const createOrder = async (orderData) => {
  try {
    await createOrGetChat(
      orderData.chatId,
      orderData.chatTitle,
      orderData.topicId
    );

    if (orderData.fromTelegram) {
      await createOrGetUser(orderData);
    }

    const {
      id,
      status = "pending",
      text = "",
      firstName = "",
      lastName = "",
      userName = "",
      chatId = "",
      action = "",
      messageId = "",
      fromTelegram = false,
      userId = "",
      chatTitle = "",
      fullName = "",
    } = orderData;

    db.prepare(
      `INSERT INTO orders
        (id, status, text, firstName, lastName, userName, updatedAt, chatId, action, messageId, fromTelegram, userId, chatTitle, fullName)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      status,
      text,
      firstName,
      lastName,
      userName,
      Date.now(),
      chatId,
      action,
      messageId ?? "",
      fromTelegram ? 1 : 0,
      userId,
      chatTitle,
      fullName
    );

    return toOrder(db.prepare("SELECT * FROM orders WHERE id = ?").get(id));
  } catch (error) {
    console.error("Failed to create order:", error);
    throw error;
  }
};

export const getAllOrders = async () => {
  try {
    return db.prepare("SELECT * FROM orders").all().map(toOrder);
  } catch (err) {
    console.error("Failed to retrieve orders in db", err);
    throw err;
  }
};

export const updateOrderStatus = async (id) => {
  const start = Date.now();
  try {
    db.prepare(
      "UPDATE orders SET status = 'ready', updatedAt = ? WHERE id = ?"
    ).run(Date.now(), id);
    const order = toOrder(
      db.prepare("SELECT * FROM orders WHERE id = ?").get(id)
    );
    if (!order) throw new Error(`Order with id ${id} not found`);
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
    const order = toOrder(
      db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId)
    );
    if (!order) throw new Error(`Order with id ${orderId} not found`);
    db.prepare("DELETE FROM orders WHERE id = ?").run(orderId);
    console.log("Order deleted in db:", order.id);
    return order;
  } catch (err) {
    console.error("Failed to delete order", err);
    throw err;
  }
};

export const updateOrderText = async (id, newText) => {
  try {
    db.prepare(
      "UPDATE orders SET text = ?, updatedAt = ? WHERE id = ?"
    ).run(newText, Date.now(), id);
    const order = toOrder(
      db.prepare("SELECT * FROM orders WHERE id = ?").get(id)
    );
    if (!order) throw new Error(`Order with id ${id} not found in db`);
    console.log("Order text updated in db:", order.id, order.text);
    return order;
  } catch (err) {
    console.error("Failed to update order text", err);
    throw err;
  }
};
