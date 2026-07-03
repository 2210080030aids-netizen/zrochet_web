function isRailwayRuntime() {
  return Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_ID
  );
}

function getDatabaseUrl() {
  const url = (process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || "").trim();
  if (!url) return undefined;
  if (url.includes("PASSWORD@HOST") || url.includes("@HOST:")) return undefined;
  if (url.includes("postgres.railway.internal") && !isRailwayRuntime()) return undefined;
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) return undefined;
  return url;
}

function resolveDatabaseUrl() {
  const url = getDatabaseUrl();
  if (url) process.env.DATABASE_URL = url;
  return url;
}

if (require.main === module) {
  const url = resolveDatabaseUrl();
  if (!url) {
    console.error(
      "No valid database URL. Add DATABASE_PUBLIC_URL to .env.local from Railway → Postgres → Connect → Public Network."
    );
    process.exit(1);
  }
  console.log("DATABASE_URL resolved for local development.");
}

module.exports = { getDatabaseUrl, resolveDatabaseUrl, isRailwayRuntime };
