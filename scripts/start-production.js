/**
 * Runs DB migrate + seed before Next.js starts (Railway production).
 * Skips when no valid DATABASE_URL is available.
 */

const { execSync } = require("child_process");
const { getDatabaseUrl } = require("./resolve-db-url");

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

const dbUrl = getDatabaseUrl();
if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
  run("npx prisma migrate deploy");
  run("npm run db:migrate-product-ids");
  run("npm run db:migrate-order-ids");
  run("npm run db:seed");
} else {
  console.log("DATABASE_URL not configured — skipping migrate and seed.");
}

run(`npx next start -H 0.0.0.0 -p ${process.env.PORT || 3000}`);
