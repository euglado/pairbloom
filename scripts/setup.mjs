import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, ".env");
function hidden(prompt) {
  return new Promise((resolve, reject) => {
    let value = "";
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (error) => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (buffer) => {
      for (const char of buffer.toString("utf8")) {
        if (char === "\u0003") {
          finish(new Error("Cancelled / İptal edildi"));
          return;
        }
        if (char === "\r" || char === "\n") {
          finish();
          return;
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (/[A-Za-z0-9._-]/.test(char)) value += char;
        else {
          finish(
            new Error("Invalid token character / Geçersiz token karakteri"),
          );
          return;
        }
        if (value.length > 200) {
          finish(new Error("Token too long / Token çok uzun"));
          return;
        }
      }
    };
    process.stdin.on("data", onData);
  });
}
async function setup() {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error(
      "Use an interactive terminal / Etkileşimli terminal kullanın",
    );
  if (fs.existsSync(file))
    throw new Error(
      ".env exists. Keep it private; delete it yourself only to reconfigure. / .env mevcut. Gizli tutun; yalnızca yeniden yapılandırmak için kendiniz silin.",
    );
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let application;
  let guild;
  try {
    application = (
      await rl.question("Application ID / Uygulama kimliği: ")
    ).trim();
    guild = (await rl.question("Server ID / Sunucu kimliği: ")).trim();
  } finally {
    rl.close();
  }
  if (!/^\d{17,20}$/.test(application) || !/^\d{17,20}$/.test(guild))
    throw new Error("IDs must be 17–20 digits / Kimlikler 17–20 rakam olmalı");
  const token = await hidden("Bot token (hidden / gizli): ");
  if (!/^[A-Za-z0-9._-]{30,200}$/.test(token))
    throw new Error("Invalid token format / Geçersiz token biçimi");
  fs.writeFileSync(
    file,
    `DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${application}\nDISCORD_GUILD_ID=${guild}\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Saved privately to .env. Windows: restrict folder access to your account. / .env kaydedildi. Windows: klasör erişimini hesabınızla sınırlayın.",
  );
  console.log(
    `Install link / Kurulum bağlantısı: https://discord.com/oauth2/authorize?client_id=${application}&permissions=3072&integration_type=0&scope=bot%20applications.commands`,
  );
  console.log(
    "Install first, then registration; see README. / Önce sunucuya kurun, ardından komut kaydı; README'ye bakın.",
  );
}
setup().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
