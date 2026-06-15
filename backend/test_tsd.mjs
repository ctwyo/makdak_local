import { google } from "googleapis";

const SPREADSHEET_ID = "1eCC7F_KBfpyvZOj3DWiRmAZ1hlv8pw5vLxFKlsIiXbk";
const CREDENTIALS_PATH = "./get-ready-tsd.json";

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Получаем список всех листов
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetList = meta.data.sheets.map(s => s.properties.title);
  console.log("Все листы в таблице:");
  sheetList.forEach((name, i) => console.log(`  ${i}: [${name}] (${Buffer.from(name).toString('hex')})`));

  // Пробуем каждый лист и ищем данные в колонке H
  for (const sheetName of sheetList) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${sheetName}'!H:H`,
      });
      const vals = (res.data.values || []).flat().filter(v => v && v.trim());
      console.log(`\nЛист "${sheetName}": ${vals.length} непустых значений в колонке H`);
      if (vals.length > 0) {
        console.log("  Первые 10:", vals.slice(0, 10));
      }
    } catch (e) {
      console.log(`\nЛист "${sheetName}": ошибка — ${e.message}`);
    }
  }
}

main().catch(err => {
  console.error("Ошибка:", err.message);
  if (err.response?.data) console.error("Детали:", JSON.stringify(err.response.data, null, 2));
});
