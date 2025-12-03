import { Telegraf, Markup } from "telegraf";
import axios from "axios";
import dotenv from "dotenv";
import cron from "node-cron";
import { createOrGetChat } from "./db.js";
import { google } from "googleapis";

dotenv.config();

// ===============================
// Конфиг
// ===============================
const PORT = 3000;
const SERVER_URL = `http://localhost:${PORT}`;
const TOKEN = process.env.BOT_TOKEN;

const SPREADSHEET_ID = "1eCC7F_KBfpyvZOj3DWiRmAZ1hlv8pw5vLxFKlsIiXbk";
const CREDENTIALS_PATH = "./get-ready-tsd.json";

// ===============================
// Инициализация бота
// ===============================
export const bot = new Telegraf(TOKEN);

let messageSent = false;

// ===============================
// Отправка сообщений из сервера
// ===============================
export async function sendMessageToTelegram(topicId, chatId, message) {
  if (messageSent) return;

  messageSent = true;
  setTimeout(() => (messageSent = false), 5000);

  try {
    await bot.telegram.sendMessage(chatId, message, {
      reply_to_message_id: topicId || undefined,
    });
  } catch (err) {
    console.error("Failed to send message by bot:", err);
  }
}

export const sendBotNotification = async (bot, chatId, message, messageId) => {
  console.time("Отправка нового статуса в боте");
  try {
    await bot.telegram.sendMessage(chatId, message, {
      reply_to_message_id: messageId,
    });
    console.log("Уведомление успешно отправлено через бота.");
    console.timeEnd("Отправка нового статуса в боте");
  } catch (error) {
    console.error("Ошибка при отправке уведомления:", error);
  }
};

// ===============================
// INLINE "ТСД" КЛАВИАТУРА
// ===============================
const inlineTsdButton = Markup.inlineKeyboard([
  Markup.button.callback("ТСД", "tsd_show")
]);

// ===============================
// /start
// ===============================
bot.start(async (ctx) => {
  const chat = ctx.chat;

  if (chat.type === "private") {
    await ctx.reply("Привет!", inlineTsdButton);
  } else {
    await ctx.reply("Привет!");
    await createOrGetChat(chat.id, chat.title);
  }
});



// ===============================
// /help
// ===============================
bot.help(async (ctx) => {
  await ctx.reply(
    "Команды:\n" +
      "@хочу — заказ\n" +
      "@монтаж — монтаж\n" +
      "ТСД — показать готовые ТСД\n"
  );
});

// ===============================
// Триггеры заказов
// ===============================
const triggers = {
  "@хочу": "zakaz",
  "@монтаж": "montazh",
};

// ===============================
// INLINE: ТСД — обработка Google Sheets
// ===============================
bot.action("tsd_show", async (ctx) => {
  if (ctx.chat.type !== "private") {
    return ctx.answerCbQuery(); // в группе — тишина
  }

  await ctx.answerCbQuery();
  const msg = await ctx.reply("Собираю данные...");

  try {
    const stats = await fetchTsdStats(ctx.from?.username);
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    await ctx.reply(formatTsdStats(stats), inlineTsdButton);
  } catch {
    await ctx.deleteMessage(msg.message_id).catch(() => {});
    await ctx.reply("Не удалось получить данные.", inlineTsdButton);
  }
});

// ===============================
// Обработка триггеров
// ===============================
bot.on("text", async (ctx) => {
  const text = ctx.message.text || "";

  const trigger = Object.keys(triggers).find((t) =>
    new RegExp(t, "gi").test(text)
  );

  if (!trigger) return;

  const cleaned = text.replace(new RegExp(trigger, "gi"), "").trim();
  if (!cleaned) {
    return ctx.reply("⚠️ Напишите текст после триггера.");
  }

  const payload = {
    text: cleaned,
    firstName: ctx.from.first_name || "",
    lastName: ctx.from.last_name || "",
    userId: ctx.from.id,
    userName: ctx.from.username || "",
    chatId: ctx.chat.id,
    chatTitle: ctx.chat.title || "",
    messageId: ctx.message.message_id,
    topicId: 0,
    action: triggers[trigger],
    fromTelegram: true,
  };

  try {
    await axios.post(`${SERVER_URL}/new-order`, payload);
    await ctx.react("✍");
  } catch (err) {
    console.error("Ошибка создания заказа:", err);
    await ctx.reply("⚠️ Ошибка при создании заказа.");
  }
});

// ===============================
// КЭШ ДЛЯ GOOGLE SHEETS
// ===============================
let cachedStats = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

// ===============================
// Google Sheets
// ===============================
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

async function fetchTsdStats(requestedBy) {
  const now = Date.now();
  if (cachedStats && now - cachedAt < CACHE_TTL) {
    return cachedStats;
  }

  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "A:Z",
  });

  const rows = res.data.values || [];
  const stats = {};

  for (const row of rows) {
    const model = (row[7] || "").trim(); // колонка H
    if (!model) continue;
    stats[model] = (stats[model] || 0) + 1;
  }

  cachedStats = stats;
  cachedAt = now;

  return stats;
}

function formatTsdStats(stats) {
  const entries = Object.entries(stats).sort(
    ([a, ca], [b, cb]) => cb - ca || a.localeCompare(b)
  );

  if (!entries.length) return "Ничего не найдено.";

  return (
    "ТСД в наличии:\n\n" +
    entries.map(([m, c]) => `${m}: ${c}`).join("\n")
  );
}

// ===============================
// ПЛАНИРОВЩИК
// ===============================
cron.schedule("0 14 * * *", async () => {
  const chatId = "-1002105456496";
  try {
    await bot.telegram.sendMessage(chatId, "Обед! 🍔", {
      reply_to_message_id: 3463,
    });
  } catch {}
});

// ===============================
// Запуск
// ===============================
bot.launch().then(() => console.log("Бот запущен ✅"));
