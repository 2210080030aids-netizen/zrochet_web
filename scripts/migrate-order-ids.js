/**
 * Migrates legacy / draft order IDs to ODZ0999, ODZ1000, …
 * Usage: npm run db:migrate-order-ids
 */

require("./resolve-db-url").resolveDatabaseUrl();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ORDER_ID_PREFIX = "ODZ";
const ORDER_ID_START = 999;
const ORDER_ID_PATTERN = /^ODZ(\d+)$/i;

function formatOrderId(sequence) {
  return `${ORDER_ID_PREFIX}${String(sequence).padStart(4, "0")}`;
}

function parseOrderIdSequence(orderId) {
  const match = ORDER_ID_PATTERN.exec(String(orderId || "").trim());
  if (!match) return null;
  const sequence = Number.parseInt(match[1], 10);
  return Number.isFinite(sequence) ? sequence : null;
}

function isPlacedOrderId(orderId) {
  return parseOrderIdSequence(orderId) !== null;
}

function paymentProofPath(orderId) {
  return `/api/orders/${encodeURIComponent(orderId)}/payment-proof`;
}

async function main() {
  const orderSummaries = await prisma.order.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, createdAt: true },
  });

  let maxSequence = ORDER_ID_START - 1;
  for (const order of orderSummaries) {
    const sequence = parseOrderIdSequence(order.id);
    if (sequence !== null && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  const legacyIds = orderSummaries
    .filter((order) => !isPlacedOrderId(order.id))
    .map((order) => order.id);

  if (!legacyIds.length) {
    console.log("No legacy order IDs to migrate. All orders already use ODZ format.");
    return;
  }

  console.log(`Migrating ${legacyIds.length} order(s) to ODZ format…`);

  for (const oldId of legacyIds) {
    const order = await prisma.order.findUnique({ where: { id: oldId } });
    if (!order || isPlacedOrderId(order.id)) continue;

    maxSequence += 1;
    const newId = formatOrderId(maxSequence);
    const paymentProofUrl = order.paymentProofUrl
      ? paymentProofPath(newId)
      : order.paymentProofUrl;

    await prisma.$transaction(
      async (tx) => {
        await tx.order.create({
          data: {
            id: newId,
            name: order.name,
            email: order.email,
            phone: order.phone,
            address: order.address,
            items: order.items,
            subtotal: order.subtotal,
            currency: order.currency,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentProofUrl,
            paymentProofMime: order.paymentProofMime,
            paymentProofData: order.paymentProofData
              ? Buffer.from(order.paymentProofData)
              : null,
            paidAt: order.paidAt,
            approvedAt: order.approvedAt,
            thankYouEmailSent: order.thankYouEmailSent,
            thankYouEmailError: order.thankYouEmailError,
            rejectionReason: order.rejectionReason,
            rejectedAt: order.rejectedAt,
            rejectionEmailSent: order.rejectionEmailSent,
            rejectionEmailError: order.rejectionEmailError,
            reviewedAt: order.reviewedAt,
            shippedAt: order.shippedAt,
            deliveryPartner: order.deliveryPartner,
            trackingId: order.trackingId,
            deliveredAt: order.deliveredAt,
            createdAt: order.createdAt,
          },
        });

        await tx.order.delete({ where: { id: order.id } });
      },
      { timeout: 120000, maxWait: 30000 }
    );

    console.log(`  ${order.id} → ${newId}`);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
