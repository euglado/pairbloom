import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { config } from "../dist/config.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
test("config rejects missing/invalid values without echoing them", () => {
  for (const env of [
    {},
    {
      DISCORD_TOKEN: "do-not-print",
      DISCORD_APPLICATION_ID: "invalid",
      DISCORD_GUILD_ID: "invalid",
    },
  ])
    assert.throws(
      () => config(env),
      (error) =>
        !error.message.includes("do-not-print") && /setup/.test(error.message),
    );
});
test("valid config parses privately without output", () => {
  const parsed = config({
    DISCORD_TOKEN: "x".repeat(35),
    DISCORD_APPLICATION_ID: "1".repeat(18),
    DISCORD_GUILD_ID: "2".repeat(18),
  });
  assert.equal(parsed.application, "1".repeat(18));
});
for (const entry of ["main", "register"])
  test(`${entry} fails closed without configuration`, () => {
    const env = { ...process.env };
    delete env.DISCORD_TOKEN;
    delete env.DISCORD_APPLICATION_ID;
    delete env.DISCORD_GUILD_ID;
    const result = spawnSync(
      process.execPath,
      [path.join(root, "dist", `${entry}.js`)],
      { env, encoding: "utf8", timeout: 10000 },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /setup/);
  });
test("noninteractive setup exits safely and creates no .env", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pairbloom-test-"));
  try {
    fs.mkdirSync(path.join(temporary, "scripts"));
    fs.copyFileSync(
      path.join(root, "scripts", "setup.mjs"),
      path.join(temporary, "scripts", "setup.mjs"),
    );
    const result = spawnSync(
      process.execPath,
      [path.join(temporary, "scripts", "setup.mjs")],
      { encoding: "utf8", timeout: 10000 },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /interactive terminal/);
    assert.equal(fs.existsSync(path.join(temporary, ".env")), false);
  } finally {
    const resolved = path.resolve(temporary);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("pairbloom-test-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
