import { Telegraf } from "telegraf";
import axios from "axios";
import dotenv from "dotenv";
import { createOrGetChat } from "./db.js";
import cron from "node-cron";
import { registerTsdHandlers } from "./get_tsd.js";
dotenv.config();
// const localIP = getLocalAddress();
const PORT = 3000;
const SERVER_URL = `http://localhost:${PORT}`;

dotenv.config();
const TOKEN = process.env.BOT_TOKEN;
export const bot = new Telegraf(TOKEN);

let messageSent = false;
export async function sendMessageToTelegram(topicId, chatId, message) {
  console.log(`messageSent ${messageSent}`);

  console.log(
    `bot send message to ${topicId}, chatId ${chatId}, text ${message}`,
  );

  if (messageSent) {
    console.log("Message already sent");
    return;
  }

  try {
    // await bot.telegram.sendMessage(message, chatId, {
    //   reply_to_message_id: topicId,
    // });
    // messageSent = true;
    // await bot.telegram.sendMessage(message, chatId, {
    //   reply_to_message_id: topicId,
    // });
  } catch (err) {
    console.error("Failed to send message by bot", err);
  } finally {
    setTimeout(() => {
      messageSent = false;
    }, 5000);
  }
}

bot.start(async (ctx) => {
  const chat = ctx.chat;
  const chatId = ctx.id;
  const chatTitle = ctx.title;
  if (chat.type === "group" || chat.type === "supergroup") {
    createOrGetChat(chatId, chatTitle);
    console.log(`added to db ${chatId} ${chatTitle}`);
  }
});

const triggers = {
  "@хочу": "zakaz",
  "@монтаж": "montazh",
};

bot.help(async (ctx) => {
  const instructionText = `📜 Данный помощник создан для соблюдения порядка заказов, 
дальнейшего просмотра и анализа данных, а также исключения случаев несвоевременной сборки и потери.
1️⃣ Для заказа оборудования, нужно поставить приставку @хoчу
2️⃣ Для заказа монтажа, нужно поставить приставку @мoнтаж
3️⃣ Инструкция вызывается командой /help`;

  const imageUrl = "./instruction.jpg"; // Укажите путь к изображению
  try {
    await ctx.replyWithPhoto(
      { source: imageUrl },
      { caption: instructionText },
    );
  } catch (error) {
    console.error("Ошибка при отправке инструкции:", error);
    ctx.reply("⚠️ Не удалось отправить инструкцию. Попробуйте позже.");
  }
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text || "";
  const chatId = ctx.chat.id;
  const messageId = ctx.message.message_id;
  const firstName = ctx.from.first_name || "Unknown";
  const lastName = ctx.from.last_name || "";
  const userId = ctx.from.id;
  const userName = ctx.from.username;

  // let chatTitle = "";
  let topicId = 0;
  const chatTitle = ctx.chat.title;

  // if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
  //   if (ctx.message.is_topic_message) {
  //     topicId = ctx.message.message_thread_id;
  //     chatTitle = ctx.message.chat.title;
  //   } else {
  //     chatTitle = "";
  //   }
  // }
  console.log(`chatTitle ${chatTitle}`);
  // Проверка наличия триггера
  const trigger = Object.keys(triggers).find((t) =>
    new RegExp(t, "gi").test(text),
  );

  if (trigger) {
    const action = triggers[trigger];
    const triggerRegex = new RegExp(`\\s*${trigger}\\s*`, "gi");
    const cleanedText = text.replace(triggerRegex, "").trim();

    if (cleanedText.length > 0) {
      try {
        const payload = {
          text: cleanedText,
          firstName: firstName,
          lastName: lastName,
          chatId: chatId,
          messageId: messageId,
          action: action,
          fromTelegram: true,
          userId: userId,
          chatTitle: chatTitle,
          topicId: topicId,
          userName: userName,
        };

        console.log(`payload bot: ${JSON.stringify(payload)}`);

        const response = await axios.post(`${SERVER_URL}/new-order`, payload);

        // Вместо ответа текстом отправляем смайлик на триггер
        // await ctx.react("🖕");
        await ctx.react("✍");
      } catch (error) {
        console.error("Ошибка при создании заказа:", error);
        await ctx.reply("⚠️ Ошибка при создании заказа. Попробуйте позже.");
      }
    } else {
      await ctx.reply(
        "⚠️ Сообщение содержит только ключевое слово. Уточните запрос.",
        { reply_to_message_id: messageId },
      );
    }
  }
});

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

cron.schedule("0 14 * * *", async () => {
  const chatId = "-1002105456496";
  const message = "Обед! 🍔";

  try {
    await bot.telegram.sendMessage(chatId, message, {
      reply_to_message_id: 3463,
    });
  } catch (error) {
    console.error("Ошибка при отправке уведомления обеда:", error);
  }
});

registerTsdHandlers(bot)

bot.launch().then(() => {
  console.log("Бот запущен ✅");
});
