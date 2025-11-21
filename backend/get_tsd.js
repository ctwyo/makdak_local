import { google } from "googleapis";
import { Markup } from "telegraf";

const SPREADSHEET_ID = "1eCC7F_KBfpyvZOj3DWiRmAZ1hlv8pw5vLxFKlsIiXbk";
const CREDENTIALS_PATH = "./get-ready-tsd.json";

export function registerTsdHandlers(bot) {
  const mainKeyboard = Markup.keyboard([["Статистика"]]).resize().persistent();

  // bot.start((ctx) => {
  //   if (!ensurePrivateChat(ctx)) return;
  //   ctx.reply(
  //     "Привет! Нажми «Статистика», чтобы посмотреть, сколько готовых ТСД есть по моделям.",
  //     mainKeyboard
  //   );
  // });

  bot.hears("Статистика", async (ctx) => {
    if (!ensurePrivateChat(ctx)) return;

    const msg = await ctx.reply("Секундочку, собираю данные...");

    try {
      const stats = await fetchTsdStats();
      await ctx.deleteMessage(msg.message_id).catch(() => {});
      await ctx.reply(formatTsdStats(stats), mainKeyboard);
    } catch (err) {
      await ctx.deleteMessage(msg.message_id).catch(() => {});
      await ctx.reply("Не удалось получить данные из таблицы.", mainKeyboard);
    }
  });
}

function ensurePrivateChat(ctx) {
  if (ctx.chat.type !== "private") {
    ctx.reply("Бот работает только в личных сообщениях.");
    return false;
  }
  return true;
}

async function fetchTsdStats() {
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "A:Z",
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return {};

  const stats = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const model = (row[7] || "").trim(); // column H (index 7)
    if (!model) continue;

    stats[model] = (stats[model] || 0) + 1;
  }

  return stats;
}

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

function formatTsdStats(stats) {
  const entries = Object.entries(stats).sort(
    ([a, ca], [b, cb]) => cb - ca || a.localeCompare(b, "ru")
  );

  if (!entries.length) return "Модели в таблице не найдены.";

  return (
    "Готовые ТСД по моделям:\n\n" +
    entries.map(([m, c]) => `${m}: ${c}`).join("\n")
  );
}
