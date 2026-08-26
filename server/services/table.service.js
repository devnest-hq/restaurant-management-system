const prisma = require("../prisma/client");

exports.createTable = async ({ tableNumber, capacity }) => {
  if (!tableNumber || !capacity) {
    const err = new Error("Table number and table capacity are required");
    err.status = 400;
    throw err;
  }

  try {
    return await prisma.table.create({
      data: {
        tableNumber,
        capacity
      }
    });

  } catch (err) {
    if (err.code === "P2002") {
      const error = new Error("This table already exists");
      error.status = 400;
      throw error;
    }
    throw err;
  }
}

exports.updateTableCapacity = async (id, capacity) => {
  if (!capacity) {
    const err = new Error("Table capacity is required");
    err.status = 400;
    throw err;
  }

  try {
    return await prisma.table.update({
      where: { id: parseInt(id) },
      data: { capacity }
    });

  } catch (err) {
    if (err.code === "P2025") {
      const error = new Error("Table not found");
      error.status = 404;
      throw error;
    }
    throw err;
  }
}

exports.deleteTable = async (id) => {
  try {
    return await prisma.table.delete({
      where: { id: parseInt(id) }
    });
  } catch (err) {
    if (err.code === "P2025") {
      const error = new Error("Table not found");
      error.status = 404;
      throw error;
    }
    throw err;
  }
}