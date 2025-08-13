import { bot } from "./bot.js";

export async function handleCourier(ctx) {
  const chatId = ctx.chat.id;
  const messageId = ctx.message.message_id;

  try {
    // Последовательный запрос данных
    const name = await askUser(ctx, chatId, "Введите имя:", messageId);
    const surname = await askUser(ctx, chatId, "Введите фамилию курьера:");
    const patronymic = await askUser(ctx, chatId, "Введите отчество курьера:");

    // Формирование полного имени
    const fullName = `${surname} ${name} ${patronymic}`;

    // Уведомление о добавлении
    await ctx.reply(`Новый курьер добавлен: ${fullName}`);
  } catch (error) {
    console.error("Ошибка при добавлении курьера:", error);
    await ctx.reply("⚠️ Ошибка при добавлении курьера. Попробуйте позже.");
  }
}

// Функция для запроса данных
async function askUser(ctx, chatId, question, replyToMessageId = null) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      bot.off("text", handler); // Удаляем обработчик после таймаута
      reject(new Error("Время ожидания истекло."));
    }, 60000); // 60 секунд на ввод сообщения

    const handler = (newCtx) => {
      if (newCtx.chat.id === chatId && newCtx.message?.text) {
        clearTimeout(timeout);
        bot.off("text", handler); // Удаляем обработчик после получения сообщения
        resolve(newCtx.message.text);
      }
    };

    bot.on("text", handler); // Добавляем обработчик на событие "text"

    // Отправляем вопрос пользователю
    ctx.reply(
      question,
      replyToMessageId ? { reply_to_message_id: replyToMessageId } : {},
    );
  });
}
