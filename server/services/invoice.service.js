const prisma = require("../prisma/client");

const TAX_RATE = parseFloat(process.env.TAX_RATE);
const SERVICE_CHARGE_RATE = parseFloat(process.env.SERVICE_CHARGE_RATE);

exports.ensureInvoiceExists = async (orderId, client = prisma) => {
  const existing = await client.invoice.findFirst({ where: { orderId } });
  if (existing) return existing;

  const order = await client.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  const foodCost = order.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  const tax = foodCost * TAX_RATE;
  const serviceCharge = foodCost * SERVICE_CHARGE_RATE;
  const discount = 0;
  const grandTotal = foodCost + tax + serviceCharge - discount;

  return client.invoice.create({
    data: {
      orderId,
      foodCost,
      tax,
      serviceCharge,
      discount,
      grandTotal
    }
  });
};

exports.getInvoiceByOrderId = async (orderId, user) => {
  const invoice = await prisma.invoice.findFirst({
    where: { orderId: parseInt(orderId) },
    include: {
      order: {
        include: {
          items: { include: { menuItem: true } },
          customer: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });

  if (!invoice) {
    const err = new Error("Invoice not found");
    err.status = 404;
    throw err;
  }

  if (user.role === "CUSTOMER" && invoice.order.customerId !== user.userId) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return invoice;
};