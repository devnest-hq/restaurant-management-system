const prisma = require("../prisma/client");

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

  return prisma.inventoryItem.update({
    where: { id: parseInt(id) },
    data: { name, quantity, unit, lowStockThreshold, supplier }
  });
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