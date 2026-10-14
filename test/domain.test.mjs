import assert from "node:assert/strict";
import test from "node:test";
import {
  CAPACITY,
  draw,
  join,
  leave,
  partnerText,
  titleText,
} from "../dist/domain.js";
import { boardCard, form } from "../dist/ui.js";

const board = () => ({
  id: "a".repeat(24),
  title: "Study topic",
  guild: "1",
  channel: "2",
  message: "3",
  expires: Date.now() + 10000,
  phase: "open",
  revision: 0,
  members: new Set(),
  pairs: new Map(),
});
test("titles trim plain input and reject unsafe formatting", () => {
  assert.equal(titleText("  Mathematics  "), "Mathematics");
  for (const title of [
    "ab",
    "x".repeat(81),
    "@everyone",
    "<@123>",
    "```code",
    "bold**",
    "[link]",
    "https://a.test",
    "www.test",
    "line\nline",
    "abc\u202e",
    "abc\u0000",
  ])
    assert.throws(() => titleText(title));
  assert.equal(titleText("Türkçe çalışma 🍀"), "Türkçe çalışma 🍀");
});
test("join is voluntary, idempotent rejection and capacity bounded", () => {
  const b = board();
  join(b, "0");
  assert.throws(() => join(b, "0"));
  for (let i = 1; i < CAPACITY; i++) join(b, String(i));
  assert.throws(() => join(b, "overflow"));
  assert.equal(b.members.size, 30);
});
test("draw requires two members and can happen once", () => {
  const b = board();
  assert.throws(() => draw(b));
  join(b, "a");
  assert.throws(() => draw(b));
  join(b, "b");
  draw(b, () => 0);
  assert.equal(b.phase, "paired");
  assert.throws(() => draw(b));
  assert.throws(() => join(b, "c"));
});
test("even shuffle gives symmetric distinct partners to every member", () => {
  for (let count = 2; count <= 30; count += 2) {
    const b = board();
    for (let i = 0; i < count; i++) join(b, String(i));
    draw(b);
    assert.equal(b.pairs.size, count);
    for (const [user, partner] of b.pairs) {
      assert.notEqual(user, partner);
      assert.ok(b.members.has(partner));
      assert.equal(b.pairs.get(partner), user);
    }
  }
});
test("odd shuffle leaves exactly one unmatched volunteer", () => {
  const b = board();
  for (let i = 0; i < 5; i++) join(b, String(i));
  draw(b, () => 0);
  assert.equal([...b.pairs.values()].filter((p) => p === null).length, 1);
  assert.equal(b.pairs.size, 5);
});
test("invalid random result cannot partially commit pairs", () => {
  const b = board();
  join(b, "a");
  join(b, "b");
  assert.throws(() => draw(b, () => 2));
  assert.equal(b.phase, "open");
  assert.equal(b.pairs.size, 0);
});
test("leaving after draw erases own identity and unmatches only partner", () => {
  const b = board();
  for (const u of ["a", "b", "c", "d"]) join(b, u);
  draw(b, () => 0);
  const partner = b.pairs.get("a");
  leave(b, "a");
  assert.equal(b.members.has("a"), false);
  assert.equal(b.pairs.has("a"), false);
  assert.equal(b.pairs.get(partner), null);
  assert.equal([...b.pairs.values()].includes("a"), false);
  assert.throws(() => leave(b, "a"));
});
test("lookup reveals only requesting member's assigned partner", () => {
  const b = board();
  for (const u of [
    "111111111111111111",
    "222222222222222222",
    "333333333333333333",
    "444444444444444444",
  ])
    join(b, u);
  assert.match(partnerText(b, "outsider"), /not joined/);
  assert.match(partnerText(b, "111111111111111111"), /Waiting/);
  draw(b, () => 0);
  const result = partnerText(b, "111111111111111111");
  const assigned = b.pairs.get("111111111111111111");
  assert.ok(result.includes(assigned));
  for (const u of b.members)
    if (u !== assigned && u !== "111111111111111111")
      assert.equal(result.includes(u), false);
});
test("public card contains counts and consent, never roster identities", () => {
  const b = board();
  join(b, "111111111111111111");
  join(b, "222222222222222222");
  draw(b);
  const card = boardCard(b);
  assert.match(card.content, /2\/30/);
  assert.match(card.content, /consent/);
  for (const u of b.members)
    assert.equal(JSON.stringify(card).includes(u), false);
  assert.equal(card.components[0].components.length, 5);
  for (const button of card.components[0].components) {
    assert.match(button.custom_id, /^pb:[a-z]+:[a-f0-9]{24}$/);
    assert.ok(button.label.length <= 80);
  }
});
test("form uses current Label modal layout within API limits", () => {
  const data = form("a".repeat(24));
  assert.equal(data.components[0].type, 18);
  assert.equal(data.components[0].component.type, 4);
  assert.equal(data.components[0].component.max_length, 80);
});
