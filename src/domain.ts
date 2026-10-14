import { randomInt } from "node:crypto";

export class UserError extends Error {}

export const LIFETIME = 8 * 60 * 60_000;
export const CAPACITY = 30;
export type Phase = "open" | "paired";
export interface Board {
  id: string;
  title: string;
  guild: string;
  channel: string;
  message: string;
  expires: number;
  phase: Phase;
  revision: number;
  members: Set<string>;
  pairs: Map<string, string | null>;
}

export function titleText(value: string): string {
  const title = value.trim();
  if (
    title.length < 3 ||
    title.length > 80 ||
    /[\p{C}\n\r<>@`*_~|\\[\]#]/u.test(title) ||
    /https?:|www\./i.test(title)
  ) {
    throw new UserError(
      "Use 3–80 plain characters, no links/mentions. / 3–80 düz karakter, bağlantı/etiket yok.",
    );
  }
  return title;
}

export function join(board: Board, user: string): void {
  if (board.phase !== "open")
    throw new UserError("Joining ended. / Katılım bitti.");
  if (board.members.has(user))
    throw new UserError("Already joined. / Zaten katıldınız.");
  if (board.members.size >= CAPACITY)
    throw new UserError("Board full (30). / Pano dolu (30).");
  board.members.add(user);
  board.revision++;
}

export function leave(board: Board, user: string): void {
  if (!board.members.delete(user))
    throw new UserError("You are not on this board. / Bu panoya katılmadınız.");
  const partner = board.pairs.get(user);
  board.pairs.delete(user);
  if (partner) board.pairs.set(partner, null);
  board.revision++;
}

export function draw(
  board: Board,
  random: (max: number) => number = randomInt,
): void {
  if (board.phase !== "open")
    throw new UserError("Already paired. / Zaten eşleştirildi.");
  if (board.members.size < 2)
    throw new UserError(
      "At least 2 volunteers required. / En az 2 gönüllü gerekli.",
    );
  const users = [...board.members];
  for (let i = users.length - 1; i > 0; i--) {
    const j = random(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i)
      throw new UserError("Invalid random source");
    const current = users[i];
    const other = users[j];
    if (current === undefined || other === undefined)
      throw new UserError("Invalid roster");
    users[i] = other;
    users[j] = current;
  }
  const pairs = new Map<string, string | null>();
  for (let i = 0; i < users.length; i += 2) {
    const first = users[i];
    const second = users[i + 1];
    if (first === undefined) throw new UserError("Invalid roster");
    pairs.set(first, second ?? null);
    if (second) pairs.set(second, first);
  }
  board.pairs = pairs;
  board.phase = "paired";
  board.revision++;
}

export function partnerText(board: Board, user: string): string {
  if (!board.members.has(user)) return "You have not joined. / Katılmadınız.";
  if (board.phase === "open")
    return "Joined. Waiting for organizer draw. / Katıldınız. Düzenleyicinin eşleştirmesi bekleniyor.";
  const partner = board.pairs.get(user);
  return partner
    ? `Your partner / Eşiniz: <@${partner}> (ID: ${partner}).\nNo DM was sent. Contact only with mutual consent. / DM gönderilmedi. Yalnızca karşılıklı rızayla iletişim kurun.`
    : "No partner: odd roster or partner withdrew. Ask for a new board. / Eş yok: tek sayı veya eşiniz ayrıldı. Yeni pano isteyin.";
}
