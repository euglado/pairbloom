import assert from "node:assert/strict";
import test from "node:test";
import { LIFETIME } from "../dist/domain.js";
import { PairingService } from "../dist/service.js";

function harness() {
  let clock = 1_000_000;
  const service = new PairingService("guild", () => clock);
  const advance = (ms = 4000) => {
    clock += ms;
  };
  const context = (overrides = {}) => {
    const calls = [];
    const c = {
      kind: "button",
      custom: "",
      guild: "guild",
      channel: "channel",
      user: "111111111111111111",
      manager: true,
      botAllowed: true,
      source: "message",
      ownSource: true,
      title: "Peer learning",
      calls,
      modal: async (payload) => {
        calls.push(["modal", payload]);
      },
      defer: async () => {
        calls.push(["defer"]);
      },
      respond: async (payload) => {
        calls.push(["respond", payload]);
      },
      send: async (payload) => {
        calls.push(["send", payload]);
        return "message";
      },
      edit: async (id, payload) => {
        calls.push(["edit", id, payload]);
      },
      ...overrides,
    };
    return c;
  };
  const last = (c) =>
    c.calls.filter((call) => call[0] === "respond").at(-1)?.[1];
  const preview = async (overrides = {}) => {
    const command = context({ kind: "command", ...overrides });
    await service.handle(command);
    const modal = command.calls.find((c) => c[0] === "modal")[1];
    const submit = context({
      kind: "form",
      custom: modal.custom_id,
      ...overrides,
    });
    await service.handle(submit);
    return last(submit).components[0].components[0].custom_id;
  };
  const publish = async () => {
    const custom = await preview();
    const c = context({ custom });
    await service.handle(c);
    assert.ok(service.board, last(c)?.content);
    return c;
  };
  const click = async (action, overrides = {}) => {
    advance();
    const c = context({
      custom: `pb:${action}:${service.board.id}`,
      ...overrides,
    });
    await service.handle(c);
    return c;
  };
  const confirmation = async (action) => {
    const c = await click(action);
    return last(c).components[0].components[0].custom_id;
  };
  return {
    service,
    context,
    advance,
    last,
    preview,
    publish,
    click,
    confirmation,
  };
}
test("form and private publication preview never send a public message", async () => {
  const h = harness();
  const custom = await h.preview();
  assert.match(custom, /^pb:publish:/);
  assert.equal(h.service.board, undefined);
});
test("publication is single-use and binds guild/channel/message", async () => {
  const h = harness();
  const c = await h.publish();
  const custom = c.custom;
  const replay = h.context({ custom });
  await h.service.handle(replay);
  assert.equal(
    replay.calls.some((c) => c[0] === "send"),
    false,
  );
  assert.match(h.last(replay).content, /expired/);
  assert.equal(h.service.board.message, "message");
});
for (const [label, overrides] of Object.entries({
  nonmanager: { manager: false },
  wrongServer: { guild: "elsewhere" },
  noBotPermissions: { botAllowed: false },
  notTextChannel: { channel: "" },
})) {
  test(`command rejects ${label} before opening modal`, async () => {
    const h = harness();
    const c = h.context({ kind: "command", ...overrides });
    await h.service.handle(c);
    assert.equal(
      c.calls.some((c) => c[0] === "modal"),
      false,
    );
    assert.equal(h.service.pending.size, 0);
  });
}
for (const [label, overrides] of Object.entries({
  otherOwner: { user: "222222222222222222" },
  otherGuild: { guild: "elsewhere" },
  otherChannel: { channel: "elsewhere" },
  lostManager: { manager: false },
  lostBotPermissions: { botAllowed: false },
})) {
  test(`publication rejects ${label}`, async () => {
    const h = harness();
    const custom = await h.preview();
    const c = h.context({ custom, ...overrides });
    await h.service.handle(c);
    assert.equal(h.service.board, undefined);
    assert.equal(
      c.calls.some((c) => c[0] === "send"),
      false,
    );
  });
}
test("expired preview and restart cannot publish", async () => {
  const h = harness();
  const custom = await h.preview();
  h.advance(600_001);
  const c = h.context({ custom });
  await h.service.handle(c);
  assert.equal(h.service.board, undefined);
  assert.match(h.last(c).content, /expired/);
  const fresh = new PairingService("guild");
  await fresh.handle(c);
  assert.equal(fresh.board, undefined);
});
test("cancellation consumes preview without public effects", async () => {
  const h = harness();
  const custom = (await h.preview()).replace("publish", "cancel");
  const c = h.context({ custom });
  await h.service.handle(c);
  assert.equal(h.service.pending.size, 0);
  assert.equal(h.service.board, undefined);
  assert.match(h.last(c).content, /Cancelled/);
});
test("failed send never creates active board or reuses consumed preview", async () => {
  const h = harness();
  const custom = await h.preview();
  const c = h.context({
    custom,
    send: async () => {
      throw new Error("sensitive network response");
    },
  });
  await h.service.handle(c);
  assert.equal(h.service.board, undefined);
  assert.equal(h.service.pending.size, 0);
  assert.equal(h.last(c).content.includes("sensitive"), false);
});
test("board is limited to one active publication", async () => {
  const h = harness();
  await h.publish();
  h.advance(11000);
  const c = h.context({ kind: "command" });
  await h.service.handle(c);
  assert.match(h.last(c).content, /Close the current/);
});
for (const [label, overrides] of Object.entries({
  forgedMessage: { source: "fake" },
  foreignAuthor: { ownSource: false },
  wrongChannel: { channel: "elsewhere" },
  wrongGuild: { guild: "elsewhere" },
})) {
  test(`board rejects ${label}`, async () => {
    const h = harness();
    await h.publish();
    const c = await h.click("join", overrides);
    assert.equal(h.service.board.members.size, 0);
    assert.equal(
      c.calls.some((c) => c[0] === "edit"),
      false,
    );
  });
}
test("ordinary members join, privately lookup and withdraw", async () => {
  const h = harness();
  await h.publish();
  const join = await h.click("join", { manager: false });
  assert.match(h.last(join).content, /Joined/);
  const mine = await h.click("mine", { manager: false });
  assert.match(h.last(mine).content, /Waiting/);
  await h.click("leave", { manager: false });
  assert.equal(h.service.board.members.size, 0);
});
test("rapid duplicate clicks do not double enroll", async () => {
  const h = harness();
  await h.publish();
  await h.click("join");
  const c = h.context({ custom: `pb:leave:${h.service.board.id}` });
  await h.service.handle(c);
  assert.equal(h.service.board.members.size, 1);
  assert.match(h.last(c).content, /Wait/);
});
test("private organizer confirmation never draws automatically", async () => {
  const h = harness();
  await h.publish();
  await h.click("join");
  await h.click("join", { user: "222222222222222222" });
  const custom = await h.confirmation("draw");
  assert.equal(h.service.board.phase, "open");
  const c = h.context({ custom });
  await h.service.handle(c);
  assert.equal(h.service.board.phase, "paired");
  assert.equal(h.service.board.pairs.size, 2);
  const mine = await h.click("mine", { manager: false });
  assert.match(h.last(mine).content, /222222222222222222/);
});
test("roster change invalidates old draw confirmation", async () => {
  const h = harness();
  await h.publish();
  await h.click("join");
  await h.click("join", { user: "222222222222222222" });
  const custom = await h.confirmation("draw");
  await h.click("join", { user: "333333333333333333" });
  const c = h.context({ custom });
  await h.service.handle(c);
  assert.equal(h.service.board.phase, "open");
  assert.match(h.last(c).content, /Roster changed/);
});
test("draw and close require fresh manager permission, even after preview", async () => {
  const h = harness();
  await h.publish();
  await h.click("join");
  await h.click("join", { user: "222222222222222222" });
  const noManager = await h.click("draw", { manager: false });
  assert.match(h.last(noManager).content, /Manage Server/);
  const custom = await h.confirmation("draw");
  const denied = h.context({ custom, manager: false });
  await h.service.handle(denied);
  assert.equal(h.service.board.phase, "open");
  const close = await h.confirmation("close");
  await h.service.handle(h.context({ custom: close, manager: false }));
  assert.ok(h.service.board);
});
test("close erases roster even when the public edit fails", async () => {
  const h = harness();
  await h.publish();
  await h.click("join");
  const saved = h.service.board;
  const custom = await h.confirmation("close");
  const c = h.context({
    custom,
    botAllowed: false,
    edit: async () => {
      throw new Error("missing permissions");
    },
  });
  await h.service.handle(c);
  assert.equal(h.service.board, undefined);
  assert.equal(saved.members.size, 0);
  assert.equal(saved.pairs.size, 0);
  assert.equal(h.service.pending.size, 0);
  assert.match(h.last(c).content, /erased/);
});
test("failed public edit keeps committed membership and explains stale count", async () => {
  const h = harness();
  await h.publish();
  const c = await h.click("join", {
    edit: async () => {
      throw new Error("fail");
    },
  });
  assert.equal(h.service.board.members.size, 1);
  assert.match(h.last(c).content, /update failed/);
});
test("rate limited public counts preserve each member's successful change", async () => {
  const h = harness();
  await h.publish();
  await h.click("join");
  const c = h.context({
    user: "222222222222222222",
    custom: `pb:join:${h.service.board.id}`,
  });
  await h.service.handle(c);
  assert.equal(h.service.board.members.size, 2);
  assert.equal(
    c.calls.some((c) => c[0] === "edit"),
    false,
  );
  assert.match(h.last(c).content, /may lag/);
});
test("board expires and cleanup bounds retained operational data", async () => {
  const h = harness();
  await h.publish();
  await h.click("join");
  h.advance(LIFETIME);
  h.service.sweep();
  assert.equal(h.service.board, undefined);
  assert.equal(h.service.cooldown.size, 0);
  assert.equal(h.service.pending.size, 0);
});
test("preview limit rejects excess rather than evicting valid previews", async () => {
  const h = harness();
  for (let i = 0; i < 100; i++)
    h.service.pending.set(String(i), { expires: Infinity });
  const c = h.context({ kind: "command" });
  await h.service.handle(c);
  assert.equal(
    c.calls.some((c) => c[0] === "modal"),
    false,
  );
  assert.equal(h.service.pending.size, 100);
});
test("concurrent publication has one send and a bounded busy response", async () => {
  const h = harness();
  const custom = await h.preview();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let sends = 0;
  const first = h.context({
    custom,
    send: async () => {
      sends++;
      await gate;
      return "message";
    },
  });
  const active = h.service.handle(first);
  await new Promise((resolve) => setImmediate(resolve));
  const second = h.context({ custom });
  await h.service.handle(second);
  assert.match(h.last(second).content, /Another change/);
  release();
  await active;
  assert.equal(sends, 1);
});
test("confirmation expiry never applies draw or close", async () => {
  const h = harness();
  await h.publish();
  const custom = await h.confirmation("close");
  h.advance(120001);
  const c = h.context({ custom });
  await h.service.handle(c);
  assert.ok(h.service.board);
  assert.match(h.last(c).content, /expired/);
});
test("unknown controls fail safely", async () => {
  const h = harness();
  const c = h.context({ custom: "pb:join:bad" });
  await h.service.handle(c);
  assert.match(h.last(c).content, /Unknown control/);
  assert.equal(c.calls[0][0], "defer");
});

test("external errors are never rendered even if formatted like bilingual guidance", async () => {
  const h = harness();
  const custom = await h.preview();
  const c = h.context({
    custom,
    send: async () => {
      throw new Error("private payload / private payload");
    },
  });
  await h.service.handle(c);
  assert.equal(h.last(c).content.includes("private payload"), false);
});

for (const [label, overrides] of Object.entries({
  owner: { user: "222222222222222222" },
  channel: { channel: "other" },
  server: { guild: "other" },
})) {
  test(`close confirmation rejects a different ${label}`, async () => {
    const h = harness();
    await h.publish();
    const custom = await h.confirmation("close");
    await h.service.handle(h.context({ custom, ...overrides }));
    assert.ok(h.service.board);
    await h.service.handle(h.context({ custom }));
    assert.equal(h.service.board, undefined);
  });
}

test("old board controls after expiry cannot enroll and erase the expired roster", async () => {
  const h = harness();
  await h.publish();
  await h.click("join");
  const saved = h.service.board;
  const custom = `pb:join:${saved.id}`;
  h.advance(LIFETIME);
  const c = h.context({ custom });
  await h.service.handle(c);
  assert.equal(saved.members.size, 0);
  assert.equal(saved.pairs.size, 0);
  assert.equal(h.service.board, undefined);
  assert.match(h.last(c).content, /unavailable/);
});
