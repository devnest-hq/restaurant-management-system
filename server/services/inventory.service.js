const prisma = require("../prisma/client");
const { notifyRoles } = require("../services/notification.service");

exports.checkAndNotifyLowStock = async (inventoryItem, tx = prisma) => {
  if (inventoryItem.quantity > inventoryItem.lowStockThreshold) {
    return;
  }

  await notifyRoles(
    ["ADMIN", "CHEF"],
    {
      type: "LOW_STOCK",
      message: `${inventoryItem.name} is low in stock: ${inventoryItem.quantity} ${inventoryItem.unit} remaining. Please restock.`,
    },
    tx
  );
}

exports.createInventoryItem = async ({ name, quantity, unit, lowStockThreshold, supplier }) => {
  if (!name|| !unit) {
    throw new Error("All fields are required");
  }

  if (quantity < 0 || lowStockThreshold < 0) {
    throw new Error("Quantity and low stock threshold must be non-negative");
  }

  if(typeof name !== 'string' || typeof unit !== 'string') {
    throw new Error("Name, unit, and supplier must be strings");
  }

  if(typeof quantity !== 'number' || typeof lowStockThreshold !== 'number') {
    throw new Error("Quantity and low stock threshold must be numbers");
  }

  return prisma.inventoryItem.create({ data: { name, quantity, unit, lowStockThreshold, supplier } });
};

// Bulk create inventory items
exports.createInventoryItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items must be a non-empty array");
  }

  for (const item of items) {
    const {
      name,
      quantity,
      unit,
      lowStockThreshold,
      supplier,
    } = item;

    if (!name || !unit) {
      throw new Error("Name and unit are required for every item");
    }

    if (
      typeof name !== "string" ||
      typeof unit !== "string"
    ) {
      throw new Error(
        "Name and unit must be strings"
      );
    }

    if (
      typeof quantity !== "number" ||
      typeof lowStockThreshold !== "number"
    ) {
      throw new Error(
        "Quantity and low stock threshold must be numbers"
      );
    }

    if (quantity < 0 || lowStockThreshold < 0) {
      throw new Error(
        "Quantity and low stock threshold must be non-negative"
      );
    }

    if (
      supplier !== undefined &&
      supplier !== null &&
      typeof supplier !== "string"
    ) {
      throw new Error("Supplier must be a string");
    }
  }

  return prisma.inventoryItem.createMany({
    data: items,
  });
};

exports.getAllInventoryItems = async () => {
  return prisma.inventoryItem.findMany({
    orderBy: { updatedAt: "desc" },
  });
};

exports.getInventoryItemById = async (id) => {
  return prisma.inventoryItem.findUnique({
    where: { id: parseInt(id) },
  });
}

exports.getLowStockItems = async () => {return prisma.$queryRaw`SELECT * FROM "InventoryItem" WHERE quantity <= "lowStockThreshold"`;}

exports.updateInventoryItem = async (id, { name, quantity, unit, lowStockThreshold, supplier }) => {
  const existing = await prisma.inventoryItem.findUnique({ where: { id: parseInt(id) } });
  if (!existing) {
    return null;
  }

  if ((quantity !== undefined && quantity < 0) || (lowStockThreshold !== undefined && lowStockThreshold < 0)) {
    throw new Error("Quantity and low stock threshold must be non-negative");
  }

  if ((name !== undefined && typeof name !== 'string') || (unit !== undefined && typeof unit !== 'string')) {
    throw new Error("Name and unit must be strings");
  }

  if ((quantity !== undefined && typeof quantity !== 'number') || (lowStockThreshold !== undefined && typeof lowStockThreshold !== 'number')) {
    throw new Error("Quantity and low stock threshold must be numbers");
  }

  const updatedItem = await prisma.inventoryItem.update({
    where: { id: parseInt(id) },
    data: { name, quantity, unit, lowStockThreshold, supplier }
  });

  // Check and notify if stock is low
  await exports.checkAndNotifyLowStock(updatedItem);

  return updatedItem;
};

exports.deleteInventoryItem = async (id) => {
  const existing = await prisma.inventoryItem.findUnique({ where: { id: parseInt(id) } });
  if (!existing) {
    return null;
  }

  return prisma.inventoryItem.delete({
    where: { id: parseInt(id) },
  });
};