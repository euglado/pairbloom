import {
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { config } from "./config.js";

async function register(): Promise<void> {
  const settings = config();
  const command = new SlashCommandBuilder()
    .setName("pairbloom")
    .setDescription(
      "Preview a voluntary study-partner board / Gönüllü çalışma eşi panosu",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
  // POST upserts this command by name; other applications/commands are preserved.
  try {
    await new REST({ version: "10" })
      .setToken(settings.token)
      .post(
        Routes.applicationGuildCommands(settings.application, settings.guild),
        { body: command.toJSON() },
      );
  } catch {
    throw new Error(
      "Command registration failed. Check IDs, token and installation privately. / Komut kaydedilemedi. Kimlikleri, tokenı ve kurulumu gizlice kontrol edin.",
    );
  }
  console.log(
    "/pairbloom registered in the configured server. / /pairbloom yapılandırılan sunucuya kaydedildi.",
  );
}
register().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Registration failed / Kayıt başarısız",
  );
  process.exitCode = 1;
});
