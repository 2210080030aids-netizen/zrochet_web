/**
 * Runs Prisma CLI with DATABASE_URL resolved from .env.local (DATABASE_PUBLIC_URL).
 * Usage: node scripts/run-prisma.js migrate deploy
 */

const { spawnSync } = require("child_process");
const { resolveDatabaseUrl } = require("./resolve-db-url");

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node scripts/run-prisma.js <prisma-args...>");
  process.exit(1);
}

const url = resolveDatabaseUrl();
if (!url) {
  console.error(
    "DATABASE_URL not configured. Add DATABASE_PUBLIC_URL to .env.local (Railway public Postgres URL)."
  );
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
