import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

/** First sequential number issued when an order is placed. */
export const ORDER_ID_START = 999;

const ORDER_ID_PREFIX = "ODZ";
const ORDER_ID_PATTERN = /^ODZ(\d+)$/i;
const DRAFT_ORDER_PREFIX = "DRAFT-";

/** Formats a sequence number as ODZ0999, ODZ1000, … then ODZ10000+. */
export function formatOrderId(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error(`Invalid order sequence: ${sequence}`);
  }
  // At least 4 digits; grows to 5+ automatically after ODZ9999.
  return `${ORDER_ID_PREFIX}${String(sequence).padStart(4, "0")}`;
}

export function parseOrderIdSequence(orderId: string): number | null {
  const match = ORDER_ID_PATTERN.exec(orderId.trim());
  if (!match) return null;
  const sequence = Number.parseInt(match[1], 10);
  return Number.isFinite(sequence) ? sequence : null;
}

/** True when the ID is a final placed ODZ order number. */
export function isPlacedOrderId(orderId: string): boolean {
  return parseOrderIdSequence(orderId) !== null;
}

/** Temporary checkout ID — does not consume ODZ sequence. */
export function createDraftOrderId(): string {
  return `${DRAFT_ORDER_PREFIX}${randomBytes(8).toString("hex")}`;
}

async function nextOrderSequence(
  client: Prisma.TransactionClient | typeof prisma
): Promise<number> {
  const orders = await client.order.findMany({
    where: { id: { startsWith: ORDER_ID_PREFIX } },
    select: { id: true },
  });

  let maxSequence = ORDER_ID_START - 1;
  for (const order of orders) {
    const sequence = parseOrderIdSequence(order.id);
    if (sequence !== null && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return maxSequence + 1;
}

/** Allocates the next unique ODZ… order ID (starts at ODZ0999). Call only when placing. */
export async function allocateNextOrderId(
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string> {
  const sequence = await nextOrderSequence(client);
  return formatOrderId(sequence);
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
