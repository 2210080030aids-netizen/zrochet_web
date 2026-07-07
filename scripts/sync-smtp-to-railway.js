/**
 * Push email variables from .env.local to Railway (web service).
 * Prerequisites: railway login && railway link (select your web service)
 * Usage: npm run railway:sync-email
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ENV_PATH = path.join(__dirname, "..", ".env.local");
const SMTP_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
];

const SENDGRID_KEYS = ["SENDGRID_API_KEY", "SENDGRID_FROM"];

function syncKeys(vars, keys, label) {
  const missing = keys.filter((k) => !vars[k]);
  if (missing.length) {
    console.warn(`Skipping ${label} — missing in .env.local:`, missing.join(", "));
    return;
  }

  console.log(`Syncing ${label} to Railway…`);
  for (const key of keys) {
    const value = vars[key];
    const escaped = value.replace(/"/g, '\\"');
    execSync(`npx @railway/cli variables set ${key}="${escaped}"`, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    console.log(`  ✓ ${key}`);
  }
}

function parseEnvFile(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(".env.local not found. Add email settings there first.");
    process.exit(1);
  }

  const vars = parseEnvFile(fs.readFileSync(ENV_PATH, "utf8"));

  syncKeys(vars, SENDGRID_KEYS, "SendGrid");
  syncKeys(vars, SMTP_KEYS, "SMTP");

  console.log("\nDone. Redeploy the web service on Railway for changes to take effect.");
}

main();
