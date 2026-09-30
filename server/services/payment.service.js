const prisma = require("../prisma/client");

const VALID_STATUSES = [
  "COMPLETED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "REFUND_FAILED", "DISPUTED"
];

// COMPLETED and FAILED belong early in an order's life.
// Each lists the current states it is allowed to replace.
const ALLOWED_FROM = {
  COMPLETED: ["PENDING", "FAILED"],
  FAILED: ["PENDING"],
};

const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

exports.applyPaymentEvent = async (orderIdParam, body = {}) => {
  const { orderId, paymentStatus, paymentData } = body;

  const id = Number(orderIdParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest("Order id must be a positive integer");
  }

  if (!orderId) throw badRequest("orderId body field missing")

  if (orderId !== undefined && String(orderId) !== String(id)) {
    throw badRequest("orderId in the body does not match the URL");
  }

  if (!VALID_STATUSES.includes(paymentStatus)) {
    throw badRequest(`paymentStatus must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  const { gateway_payment_id, refund_id, refund_amount } = paymentData || {};

  if (refund_amount != null && (Number.isNaN(Number(refund_amount)) || Number(refund_amount) < 0)) {
    throw badRequest("refund_amount must be a non-negative number");
  }

  const gatewayPaymentId = gateway_payment_id != null ? String(gateway_payment_id) : null;
  const refundId = refund_id != null ? String(refund_id) : null;

  // Only write the fields this event actually carried
  const data = { paymentStatus };
  if (gatewayPaymentId) data.gatewayPaymentId = gatewayPaymentId;
  if (refundId) data.refundId = refundId;
  if (refund_amount != null) data.refundAmount = refund_amount;

  // Encode "is this event still worth applying?" into the query itself
  let where;
  if (ALLOWED_FROM[paymentStatus]) {
    where = { id, paymentStatus: { in: ALLOWED_FROM[paymentStatus] } };
  } else {
    const alreadyApplied = { paymentStatus };
    if (refundId) alreadyApplied.refundId = refundId;
    where = { id, NOT: alreadyApplied };
  }

  const result = await prisma.order.updateMany({ where, data });
  console.log("updateMany result:", result);

  if (result.count === 0) {
    const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!order) {
      const err = new Error("Order not found");
      err.status = 404;
      throw err;
    }
  }

  return { applied: result.count > 0 };
};