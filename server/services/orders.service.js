const prisma = require("../prisma/client");
const inventoryService = require("./inventory.service");
const invoiceService = require("./invoice.service");
const { createNotification, notifyRoles } = require("./notification.service");

const VALID_STATUSES = ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"];

exports.createOrder = async ({ customerId, items }) => {
  if (!items || items.length === 0) {
    throw new Error("Order must include at least one item");
  }

  for (const item of items) {
    if (!Number.isInteger(item.menuItemId) || item.menuItemId <= 0) {
      throw new Error("Invalid menu item ID");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Quantity must be a positive whole number");
    }
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

  const order = await prisma.order.create({
    data: {
      customerId,
      totalPrice,
      status: "PENDING",
      items: { create: orderItemsData },
    },
    include: { items: { include: { menuItem: true } } },
  });

  await invoiceService.ensureInvoiceExists(order.id);

  await notifyRoles(
    ["ADMIN", "CHEF"],
    {
      type: "NEW_ORDER",
      message: `Your order ${order.id} has been placed successfully. Total: $${order.totalPrice.toFixed(2)}.`,
    }
  );
  
  await createNotification({
    userId: customerId,
    type: "ORDER_PLACED",
    message: `Your order ${order.id} has been placed successfully. Total: $${order.totalPrice.toFixed(2)}.`,
  });

  return order;
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

exports.getOrdersByCustomer = (customerId) =>
prisma.order.findMany({
  where: { customerId },
  include: { items: { include: { menuItem: true } } },
  orderBy: { createdAt: "desc" },
});

exports.updateOrderStatus = async (id, status) => {
  const orderId = parseInt(id);

  if (!VALID_STATUSES.includes(status)) {
    throw new Error(
      `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`
    );
  }

  if (status === "SERVED") {
    return exports.completeOrder(orderId);
  }

  const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });

  if (!currentOrder) {
    throw new Error("Order not found");
  }

  if (currentOrder.status === "SERVED" || currentOrder.status === "CANCELLED") {
    throw new Error(`Cannot change status of a ${currentOrder.status} order`);
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  await createNotification({
    userId: order.customerId,
    type: "ORDER STATUS UPDATED",
    message: `Your order ${order.id} status has been updated to ${status}.`
  });

  return order;
};


exports.completeOrder = async (orderId) => {
  const id = parseInt(orderId);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Get the order and its ingredients
    const order = await tx.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                menuItemIngredients: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // 2. Prevent duplicate completion
    if (order.status === "SERVED") {
      throw new Error("Order has already been completed");
    }

    if (order.status === "CANCELLED") {
      throw new Error("Cancelled orders cannot be completed");
    }

    if (order.status !== "READY") {
      throw new Error("Only ready orders can be completed");
    }

    await invoiceService.ensureInvoiceExists(id, tx);

    // 3. Calculate inventory usage
    const inventoryUsage = new Map();

    for (const orderItem of order.items) {
      for (const ingredient of orderItem.menuItem.menuItemIngredients) {
        const amountUsed =
          ingredient.quantityUsed * orderItem.quantity;

        const currentUsage =
          inventoryUsage.get(ingredient.inventoryItemId) || 0;

        inventoryUsage.set(
          ingredient.inventoryItemId,
          currentUsage + amountUsed
        );
      }
    }

    // 4. Atomically deduct inventory
    for (const [inventoryId, amountUsed] of inventoryUsage) {
      const updated = await tx.inventoryItem.updateMany({
        where: {
          id: inventoryId,
          quantity: {
            gte: amountUsed,
          },
        },
        data: {
          quantity: {
            decrement: amountUsed,
          },
        },
      });

      if (updated.count === 0) {
        throw new Error(
          `Insufficient inventory for inventory item ${inventoryId}`
        );
      }

      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryId }
      });
      await inventoryService.checkAndNotifyLowStock(inventoryItem, tx);
    }

    // 5. Mark order as SERVED
    const completedOrder = await tx.order.update({
      where: { id },
      data: {
        status: "SERVED",
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return completedOrder;
  });

  await createNotification({
    userId: result.customerId,
    type: "ORDER COMPLETED",
    message: `Your order ${result.id} has been completed and served. Enjoy your meal!`
  });

  return result;
};

exports.getKitchenOrders = () => {
  return prisma.order.findMany({
    where: { status: { in: ["PENDING", "PREPARING"] } },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: "asc" },
  });
};