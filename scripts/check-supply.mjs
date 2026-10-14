import fs from "node:fs";
import path from "node:path";

const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const licenses = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "(MIT OR Apache-2.0)",
  "MIT OR Apache-2.0",
  "(MIT AND Zlib)",
]);
let dependencies = 0;
for (const [name, pkg] of Object.entries(lock.packages)) {
  if (!name) continue;
  if (!licenses.has(pkg.license))
    throw new Error(`Review dependency license: ${name} (${pkg.license})`);
  if (
    !pkg.resolved?.startsWith("https://registry.npmjs.org/") ||
    !/^sha512-[A-Za-z0-9+/]+=*$/.test(pkg.integrity ?? "") ||
    pkg.hasInstallScript
  )
    throw new Error(`Review dependency source/integrity/script: ${name}`);
  dependencies++;
}
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:mfa\.[\w-]{40,}|[\w-]{24,}\.[\w-]{6}\.[\w-]{27,})/,
  /(?:ghp|github_pat)_[A-Za-z0-9_]{25,}/,
  /DISCORD_TOKEN[ \t]*=[ \t]*["']?[A-Za-z0-9._-]{30,}/,
];
let files = 0;
function scan(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist"].includes(item.name)) continue;
    const file = path.join(dir, item.name);
    if (item.isSymbolicLink()) throw new Error(`Unexpected symlink: ${file}`);
    if (item.isDirectory()) {
      scan(file);
      continue;
    }
    if (item.name.startsWith(".env") && item.name !== ".env.example")
      throw new Error(`Do not scan/publish real environment files: ${file}`);
    const source = fs.readFileSync(file, "utf8");
    if (patterns.some((pattern) => pattern.test(source)))
      throw new Error(`Potential credential in ${file}; value not logged`);
    files++;
  }
}
scan(".");
console.log(
  `Supply check passed: ${dependencies} license/registry/SHA-512/no-install-script records; ${files} source credential-pattern scans. Patterns are heuristic.`,
);
