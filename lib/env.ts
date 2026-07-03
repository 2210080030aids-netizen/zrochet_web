/** True when running on Railway (internal DB URLs work here). */
export function isRailwayRuntime(): boolean {
  return Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_ID
  );
}

/** Resolves a Postgres URL for the current environment. */
export function getDatabaseUrl(): string | undefined {
  const url = (
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_PUBLIC_URL?.trim() ||
    ""
  );
  if (!url) return undefined;
  if (url.includes("PASSWORD@HOST") || url.includes("@HOST:")) return undefined;
  // Internal Railway hostname only works inside Railway, not on your PC
  if (url.includes("postgres.railway.internal") && !isRailwayRuntime()) return undefined;
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) return undefined;
  return url;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}

/** Prefer DATABASE_PUBLIC_URL locally; keep Railway internal URL in production. */
export function applyDatabaseUrlEnv(): void {
  const url = getDatabaseUrl();
  if (url) {
    process.env.DATABASE_URL = url;
  }
}
