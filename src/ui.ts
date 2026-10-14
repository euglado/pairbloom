import type {
  APIActionRowComponent,
  APIButtonComponent,
  APIModalInteractionResponseCallbackData,
} from "discord.js";
import { ButtonStyle, ComponentType } from "discord.js";
import type { Board } from "./domain.js";

export interface Card {
  content: string;
  components: APIActionRowComponent<APIButtonComponent>[];
}
export function buttons(
  items: [
    string,
    string,
    (
      | ButtonStyle.Primary
      | ButtonStyle.Secondary
      | ButtonStyle.Success
      | ButtonStyle.Danger
    ),
  ][],
): APIActionRowComponent<APIButtonComponent>[] {
  return [
    {
      type: ComponentType.ActionRow,
      components: items.map(([custom_id, label, style]) => ({
        type: ComponentType.Button,
        custom_id,
        label,
        style,
      })),
    },
  ];
}
export function boardCard(board: Board): Card {
  const control = (action: string) => `pb:${action}:${board.id}`;
  return {
    content: `PairBloom — ${board.title}\n${board.phase === "open" ? "Open / Açık" : "Paired / Eşleştirildi"} · ${board.members.size}/30\nVoluntary study partners. Your Discord ID is shared only with your assigned partner.\nGönüllü çalışma eşleri. Discord kimliğiniz yalnızca eşinizle paylaşılır.\nJoin = consent to pairing. Leave erases your roster entry, even after draw.\nKatıl = eşleştirme onayı. Ayrıl, eşleştirme sonrası da kaydınızı siler.\nExpires / Bitiş: <t:${Math.floor(board.expires / 1000)}:R>. Restart ends board / Yeniden başlatma panoyu bitirir.\nAn odd roster leaves one person unmatched. / Tek sayıda bir kişi eşsiz kalır.`,
    components: buttons([
      [control("join"), "Join / Katıl", ButtonStyle.Success],
      [control("leave"), "Leave / Ayrıl", ButtonStyle.Secondary],
      [control("mine"), "My partner / Eşim", ButtonStyle.Primary],
      [control("draw"), "Draw / Eşleştir", ButtonStyle.Secondary],
      [control("close"), "Close / Kapat", ButtonStyle.Danger],
    ]),
  };
}
export function form(id: string): APIModalInteractionResponseCallbackData {
  return {
    custom_id: `pb:form:${id}`,
    title: "PairBloom",
    components: [
      {
        type: ComponentType.Label,
        label: "Study topic / Çalışma konusu",
        component: {
          type: ComponentType.TextInput,
          custom_id: "title",
          style: 1,
          min_length: 3,
          max_length: 80,
          required: true,
          placeholder: "English conversation / İngilizce sohbet",
        },
      },
    ],
  };
}
export function preview(title: string, id: string): Card {
  return {
    content: `Private preview / Özel önizleme\nPairBloom — ${title}\nOne board, 30 volunteers, 8 hours. No automatic DMs.\nBir pano, 30 gönüllü, 8 saat. Otomatik DM yok.\nPublic counts only; a draw shares each participant's ID with their partner.\nYalnızca sayılar herkese açık; eşleştirme kimlikleri eşlere gösterir.\nOdd roster: one unmatched person. Restart loses all entries.\nTek sayı: bir kişi eşsiz. Yeniden başlatma tüm kayıtları siler.`,
    components: buttons([
      [`pb:publish:${id}`, "Publish / Yayımla", ButtonStyle.Success],
      [`pb:cancel:${id}`, "Cancel / İptal", ButtonStyle.Secondary],
    ]),
  };
}
