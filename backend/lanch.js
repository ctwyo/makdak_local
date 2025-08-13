import { Telegraf } from "telegraf";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

cron.schedule("0 12 * * *", async () => {
  const chatId = "123";
  const message = "Привет! обед!";

  try {
    await bot.telegram.sendMessage(chatId, message, {
      reply_to_message_id: 4,
    });
  } catch (error) {
    console.error("Ошибка при отправке уведомления обеда:", error);
  }
});
