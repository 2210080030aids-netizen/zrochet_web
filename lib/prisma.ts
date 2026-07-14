import { PrismaClient } from "@prisma/client";
import { applyDatabaseUrlEnv, isDatabaseConfigured } from "@/lib/env";

applyDatabaseUrlEnv();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  // Recreate after `prisma generate` if HMR left a stale client without new models.
  if (cached && "productMediaFile" in cached && "productReview" in cached) {
    return cached;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { isDatabaseConfigured };
