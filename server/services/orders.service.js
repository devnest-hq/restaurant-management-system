const prisma = require("../prisma/client");

const VALID_STATUSES = ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"];

exports.createOrder = async ({ customerId, items }) => {
  if (!items || items.length === 0) {
    throw new Error("Order must include at least one item");
  }

  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  });

  let totalPrice = 0;
  const orderItemsData = items.map((item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
    totalPrice += menuItem.price * item.quantity;
    return { menuItemId: item.menuItemId, quantity: item.quantity, unitPrice: menuItem.price };
  });

  return prisma.order.create({
    data: {
      customerId,
      totalPrice,
      status: "PENDING",
      items: { create: orderItemsData },
    },
    include: { items: { include: { menuItem: true } } },
  });
};

exports.getOrderById = (id) =>
  prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: {
      items: { include: { menuItem: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

exports.getAllOrders = () =>
  prisma.order.findMany({
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: "desc" },
  });

exports.updateOrderStatus = (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
  }
  return prisma.order.update({
    where: { id: parseInt(id) },
    data: { status },
    include: { items: { include: { menuItem: true } } },
  });
};

exports.getKitchenOrders = () =>
  prisma.order.findMany({
    where: { status: { in: ["PENDING", "PREPARING"] } },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: "asc" },
  });