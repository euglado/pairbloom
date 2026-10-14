import { randomBytes } from "node:crypto";
import {
  type APIModalInteractionResponseCallbackData,
  ButtonStyle,
} from "discord.js";
import {
  type Board,
  draw,
  join,
  LIFETIME,
  leave,
  partnerText,
  titleText,
  UserError,
} from "./domain.js";
import { boardCard, buttons, type Card, form, preview } from "./ui.js";

export interface Context {
  kind: "command" | "form" | "button";
  custom: string;
  guild: string;
  channel: string;
  user: string;
  manager: boolean;
  botAllowed: boolean;
  source: string;
  ownSource: boolean;
  title: string;
  modal(data: APIModalInteractionResponseCallbackData): Promise<void>;
  defer(): Promise<void>;
  respond(card: Card): Promise<void>;
  send(card: Card): Promise<string>;
  edit(message: string, card: Card): Promise<void>;
}
interface Pending {
  kind: "form" | "publish" | "draw" | "close";
  user: string;
  guild: string;
  channel: string;
  expires: number;
  title: string;
  board: string;
  revision: number;
}
const empty = (content: string): Card => ({ content, components: [] });
const manager = (c: Context) => {
  if (!c.manager)
    throw new UserError("Manage Server required. / Sunucuyu Yönet gerekli.");
};

export class PairingService {
  board: Board | undefined;
  readonly pending = new Map<string, Pending>();
  readonly cooldown = new Map<string, number>();
  private busy = false;
  private lastPublish = -Infinity;
  constructor(
    readonly guild: string,
    readonly now: () => number = Date.now,
  ) {}

  sweep(): void {
    const now = this.now();
    if (this.board && this.board.expires <= now) {
      this.board.members.clear();
      this.board.pairs.clear();
      this.board = undefined;
    }
    for (const [id, entry] of this.pending)
      if (entry.expires <= now) this.pending.delete(id);
    for (const [id, expires] of this.cooldown)
      if (expires <= now) this.cooldown.delete(id);
  }
  private wait(key: string, duration: number): void {
    if ((this.cooldown.get(key) ?? 0) > this.now())
      throw new UserError(
        "Wait a few seconds and retry. / Birkaç saniye bekleyip deneyin.",
      );
    if (this.cooldown.size >= 2000)
      throw new UserError("Busy; retry shortly. / Yoğun; birazdan deneyin.");
    this.cooldown.set(key, this.now() + duration);
  }
  private ticket(c: Context, kind: Pending["kind"], title = ""): string {
    if (this.pending.size >= 100)
      throw new UserError(
        "Too many previews; retry later. / Çok fazla önizleme; sonra deneyin.",
      );
    const id = randomBytes(12).toString("hex");
    this.pending.set(id, {
      kind,
      user: c.user,
      guild: c.guild,
      channel: c.channel,
      expires:
        this.now() + (kind === "draw" || kind === "close" ? 120_000 : 600_000),
      title,
      board: this.board?.id ?? "",
      revision: this.board?.revision ?? 0,
    });
    return id;
  }
  private take(c: Context, id: string, expected?: Pending["kind"]): Pending {
    const entry = this.pending.get(id);
    if (
      !entry ||
      entry.user !== c.user ||
      entry.guild !== c.guild ||
      entry.channel !== c.channel ||
      (expected && entry.kind !== expected)
    )
      throw new UserError(
        "Preview expired or belongs elsewhere. / Önizleme süresi doldu veya size ait değil.",
      );
    this.pending.delete(id);
    return entry;
  }
  private current(c: Context, id: string): Board {
    const board = this.board;
    if (
      !board ||
      board.id !== id ||
      board.guild !== c.guild ||
      board.channel !== c.channel ||
      board.message !== c.source ||
      !c.ownSource
    )
      throw new UserError(
        "Board unavailable. Ask a manager to remove the old card. / Pano yok. Yöneticiden eski kartı kaldırmasını isteyin.",
      );
    return board;
  }
  async handle(c: Context): Promise<void> {
    this.sweep();
    if (c.kind === "command") {
      // A modal must be the initial response; perform only synchronous checks first.
      try {
        this.scope(c);
        manager(c);
        if (this.board)
          throw new UserError(
            "Close the current board first. / Önce mevcut panoyu kapatın.",
          );
        this.wait(`form:${c.user}`, 10_000);
        await c.modal(form(this.ticket(c, "form")));
      } catch (error) {
        await c.respond(empty(this.message(error)));
      }
      return;
    }
    await c.defer();
    if (this.busy) {
      await c.respond(
        empty(
          "Another change is saving; retry. / Başka değişiklik kaydediliyor; yeniden deneyin.",
        ),
      );
      return;
    }
    this.busy = true;
    try {
      this.sweep();
      this.scope(c);
      const [, action, id] = c.custom.split(":");
      if (!action || !id || !/^pb:[a-z]+:[a-f0-9]{24}$/.test(c.custom))
        throw new UserError("Unknown control. / Bilinmeyen düğme.");
      if (c.kind === "form") {
        if (action !== "form")
          throw new UserError("Unknown form. / Bilinmeyen form.");
        manager(c);
        this.take(c, id, "form");
        const title = titleText(c.title);
        await c.respond(preview(title, this.ticket(c, "publish", title)));
      } else if (action === "cancel") {
        this.take(c, id);
        await c.respond(empty("Cancelled. / İptal edildi."));
      } else if (action === "publish") {
        manager(c);
        if (!c.botAllowed)
          throw new UserError(
            "Restore View Channel + Send Messages. / Kanalı Gör + Mesaj Gönder izinlerini düzeltin.",
          );
        const entry = this.take(c, id, "publish");
        if (this.board)
          throw new UserError("A board already exists. / Zaten bir pano var.");
        if (this.now() - this.lastPublish < 60_000)
          throw new UserError(
            "One publication per minute. / Dakikada bir yayın.",
          );
        this.lastPublish = this.now();
        const board: Board = {
          id: randomBytes(12).toString("hex"),
          title: entry.title,
          guild: c.guild,
          channel: c.channel,
          message: "",
          expires: this.now() + LIFETIME,
          phase: "open",
          revision: 0,
          members: new Set(),
          pairs: new Map(),
        };
        board.message = await c.send(boardCard(board));
        this.board = board;
        await c.respond(empty("Published. / Yayımlandı."));
      } else if (action === "confirm") {
        manager(c);
        const entry = this.take(c, id);
        const board = this.board;
        if (
          !board ||
          board.id !== entry.board ||
          (entry.kind !== "draw" && entry.kind !== "close")
        )
          throw new UserError("Board changed. / Pano değişti.");
        if (entry.kind === "draw") {
          if (board.revision !== entry.revision)
            throw new UserError(
              "Roster changed. Preview the draw again. / Katılım değişti. Eşleştirmeyi yeniden önizleyin.",
            );
          draw(board);
          await this.refresh(
            c,
            board,
            "Paired. Members can use My partner. / Eşleştirildi. Üyeler Eşim düğmesini kullanabilir.",
          );
        } else {
          this.board = undefined;
          this.pending.clear();
          board.members.clear();
          board.pairs.clear();
          try {
            await c.edit(
              board.message,
              empty(
                `PairBloom — ${board.title}\nClosed; roster erased. / Kapandı; katılım silindi.`,
              ),
            );
          } catch {
            await c.respond(
              empty(
                "Roster erased. Card could not be updated; remove it manually. / Katılım silindi. Kart güncellenemedi; elle kaldırın.",
              ),
            );
            return;
          }
          await c.respond(
            empty("Closed; roster erased. / Kapandı; katılım silindi."),
          );
        }
      } else {
        const board = this.current(c, id);
        await this.boardAction(c, board, action);
      }
    } catch (error) {
      await c.respond(empty(this.message(error)));
    } finally {
      this.busy = false;
    }
  }
  private scope(c: Context): void {
    if (c.guild !== this.guild || !c.channel)
      throw new UserError(
        "Use the configured server. / Yapılandırılan sunucuyu kullanın.",
      );
    if (c.kind === "command" && !c.botAllowed)
      throw new UserError(
        "Bot needs View Channel + Send Messages. / Bot için Kanalı Gör + Mesaj Gönder gerekli.",
      );
  }
  private async boardAction(
    c: Context,
    board: Board,
    action: string,
  ): Promise<void> {
    this.wait(`click:${c.user}`, 3000);
    if (action === "mine") {
      await c.respond(empty(partnerText(board, c.user)));
      return;
    }
    if (action === "draw" || action === "close") {
      manager(c);
      if (
        action === "draw" &&
        (board.phase !== "open" || board.members.size < 2)
      )
        throw new UserError(
          "Need an open board with 2+ volunteers. / Açık panoda en az 2 gönüllü gerekli.",
        );
      const ticket = this.ticket(c, action);
      await c.respond({
        content:
          action === "draw"
            ? `Draw ${board.members.size} volunteers? Joining will end. One may be unmatched.\n${board.members.size} gönüllü eşleştirilsin mi? Katılım bitecek. Bir kişi eşsiz kalabilir.`
            : "Close and erase the entire roster? Existing private Discord replies cannot be recalled.\nPano kapansın ve katılım silinsin mi? Mevcut özel Discord yanıtları geri alınamaz.",
        components: buttons([
          [`pb:confirm:${ticket}`, "Confirm / Onayla", ButtonStyle.Danger],
          [`pb:cancel:${ticket}`, "Cancel / İptal", ButtonStyle.Secondary],
        ]),
      });
      return;
    }
    if (action === "join") join(board, c.user);
    else if (action === "leave") leave(board, c.user);
    else throw new UserError("Unknown control. / Bilinmeyen düğme.");
    await this.refresh(
      c,
      board,
      action === "join"
        ? "Joined. Your ID will be shared with your partner after draw. / Katıldınız. Kimliğiniz eşleştirme sonrası eşinizle paylaşılır."
        : "Your entry erased. / Kaydınız silindi.",
    );
  }
  private async refresh(
    c: Context,
    board: Board,
    result: string,
  ): Promise<void> {
    // Keep state authoritative without adding delayed Discord edit jobs to memory.
    if ((this.cooldown.get("public-edit") ?? 0) > this.now()) {
      await c.respond(
        empty(
          `${result}\nPublic count may lag; the next accepted change refreshes it. / Herkese açık sayı gecikebilir; sonraki uygun değişiklik günceller.`,
        ),
      );
      return;
    }
    this.cooldown.set("public-edit", this.now() + 2000);
    try {
      await c.edit(board.message, boardCard(board));
    } catch {
      await c.respond(
        empty(
          `${result}\nPublic count update failed. Retry My partner to check your status; ask a manager to restore permissions. / Herkese açık sayı güncellenemedi. Eşim ile durumunuza bakın; yöneticiden izinleri düzeltmesini isteyin.`,
        ),
      );
      return;
    }
    await c.respond(empty(result));
  }
  private message(error: unknown): string {
    return error instanceof UserError
      ? error.message
      : "Discord request failed. Check permissions and retry; do not share your token. / Discord isteği başarısız. İzinleri kontrol edip deneyin; tokenınızı paylaşmayın.";
  }
}
