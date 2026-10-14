export function config(env: NodeJS.ProcessEnv = process.env): {
  token: string;
  application: string;
  guild: string;
} {
  const token = env.DISCORD_TOKEN?.trim() ?? "";
  const application = env.DISCORD_APPLICATION_ID?.trim() ?? "";
  const guild = env.DISCORD_GUILD_ID?.trim() ?? "";
  if (
    !/^[A-Za-z0-9._-]{30,200}$/.test(token) ||
    !/^\d{17,20}$/.test(application) ||
    !/^\d{17,20}$/.test(guild)
  ) {
    throw new Error(
      "Run setup.cmd or ./setup.sh first. / Önce setup.cmd veya ./setup.sh çalıştırın. Never share .env / .env paylaşmayın.",
    );
  }
  return { token, application, guild };
}
