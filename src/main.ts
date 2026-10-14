import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  type Interaction,
  MessageFlags,
  Options,
  PermissionFlagsBits,
} from "discord.js";
import { config } from "./config.js";
import { type Context, PairingService } from "./service.js";

const mentions = { parse: [] as [], repliedUser: false };
const safeFlags = MessageFlags.SuppressEmbeds;

async function start(): Promise<void> {
  const settings = config();
  const service = new PairingService(settings.guild);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: mentions,
    makeCache: Options.cacheWithLimits({
      MessageManager: 0,
      GuildMemberManager: 0,
      PresenceManager: 0,
      ReactionManager: 0,
    }),
  });
  const timer = setInterval(() => service.sweep(), 60_000);
  timer.unref();
  client.once(Events.ClientReady, () =>
    console.log("PairBloom connected. / PairBloom bağlandı."),
  );
  client.on(Events.Error, () =>
    console.error(
      "Discord connection error; inspect network and Portal settings. / Discord bağlantı hatası; ağ ve Portal ayarlarını inceleyin.",
    ),
  );
  client.on(Events.InteractionCreate, (i: Interaction) => {
    void (async () => {
      if (!(i.isChatInputCommand() || i.isModalSubmit() || i.isButton()))
        return;
      if (
        i.isChatInputCommand()
          ? i.commandName !== "pairbloom"
          : !i.customId.startsWith("pb:")
      )
        return;
      if (!i.inGuild()) return;
      const context: Context = {
        kind: i.isChatInputCommand()
          ? "command"
          : i.isModalSubmit()
            ? "form"
            : "button",
        custom: i.isChatInputCommand() ? "" : i.customId,
        guild: i.guildId,
        channel:
          i.channel?.type === ChannelType.GuildText ? (i.channelId ?? "") : "",
        user: i.user.id,
        manager:
          i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false,
        botAllowed:
          i.appPermissions?.has(
            PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages,
          ) ?? false,
        source: i.isButton() ? i.message.id : "",
        ownSource:
          i.isButton() &&
          i.message.author.id === client.user?.id &&
          !i.message.webhookId,
        title: i.isModalSubmit() ? i.fields.getTextInputValue("title") : "",
        modal: async (data) => {
          if (i.isChatInputCommand()) await i.showModal(data);
        },
        defer: async () => {
          await i.deferReply({ flags: MessageFlags.Ephemeral });
        },
        respond: async (card) => {
          const payload = { ...card, allowedMentions: mentions };
          if (i.deferred || i.replied)
            await i.editReply({ ...payload, flags: safeFlags });
          else
            await i.reply({
              ...payload,
              flags: MessageFlags.Ephemeral | safeFlags,
            });
        },
        send: async (card) => {
          const channel = i.channel;
          if (!channel || channel.type !== ChannelType.GuildText)
            throw new Error("Use a text channel. / Metin kanalı kullanın.");
          return (
            await channel.send({
              ...card,
              allowedMentions: mentions,
              flags: safeFlags,
            })
          ).id;
        },
        edit: async (message, card) => {
          const channel = i.channel;
          if (!channel || channel.type !== ChannelType.GuildText)
            throw new Error("Use a text channel. / Metin kanalı kullanın.");
          await channel.messages.edit(message, {
            ...card,
            allowedMentions: mentions,
            flags: safeFlags,
          });
        },
      };
      await service.handle(context).catch(async () => {
        console.error(
          "Interaction failed; no payload logged. / Etkileşim başarısız; içerik kaydedilmedi.",
        );
        try {
          await context.respond({
            content:
              "Request failed; check your status before retrying. / İstek başarısız; yeniden denemeden durumunuzu kontrol edin.",
            components: [],
          });
        } catch {
          /* Expired interaction: nothing safe to retry. */
        }
      });
    })().catch(() =>
      console.error(
        "Unsupported interaction ignored; no payload logged. / Desteklenmeyen etkileşim atlandı; içerik kaydedilmedi.",
      ),
    );
  });
  const stop = () => {
    clearInterval(timer);
    service.pending.clear();
    service.cooldown.clear();
    service.board?.members.clear();
    service.board?.pairs.clear();
    service.board = undefined;
    client.destroy();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    await client.login(settings.token);
  } catch {
    stop();
    throw new Error(
      "Could not connect. Check token privately and network. / Bağlanılamadı. Tokenı gizlice ve ağı kontrol edin.",
    );
  }
}
start().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Startup failed / Başlatılamadı",
  );
  process.exitCode = 1;
});
