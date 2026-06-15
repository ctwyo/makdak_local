import Database from "better-sqlite3";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database(path.join(__dirname, "orders.db"));
db.pragma("journal_mode = WAL");

const users = JSON.parse(
  readFileSync(path.join(__dirname, "../tealpos-orders.users.json"), "utf-8")
);

const insert = db.prepare(
  "INSERT OR IGNORE INTO users (userId, firstName, lastName, fullName, userName, role) VALUES (?, ?, ?, ?, ?, ?)"
);

const importAll = db.transaction((users) => {
  let inserted = 0;
  let skipped = 0;
  for (const u of users) {
    const info = insert.run(
      u.userId ?? "",
      u.firstName ?? "",
      u.lastName ?? "",
      u.fullName ?? "",
      u.userName ?? "",
      u.role ?? "courier"
    );
    if (info.changes > 0) {
      inserted++;
      console.log(`+ ${u.fullName || u.firstName} (${u.userId})`);
    } else {
      skipped++;
      console.log(`= уже есть: ${u.fullName || u.firstName} (${u.userId})`);
    }
  }
  return { inserted, skipped };
});

const { inserted, skipped } = importAll(users);
console.log(`\nГотово: добавлено ${inserted}, пропущено ${skipped}`);
