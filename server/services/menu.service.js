const prisma = require("../prisma/client");

exports.createMenuItem = ({ name, category, price, description, imageUrl }) => {
  if (!name || !category || !price) {
    const err = new Error("All fields are required");
    err.status = 400;
    throw err;
  }

  return prisma.menuItem.create({
    data: {
      name,
      category,
      price,
      description,
      imageUrl
    }
  });
}

exports.updateMenuItem = async (id, { name, price, available, category, description }) => {
  try {
    return prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        name,
        price,
        category,
        available,
        description
      }
    });
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error("Menu item not found");
      error.status = 404;
      throw error;
    }
    throw err;
  }
}

exports.getAllMenuItems = async ({ category, available } = {}) => {
  const where = {};
  if (category) where.category = category;
  if (available !== undefined) where.available = available === "true";

  return prisma.menuItem.findMany({ where });
}

exports.getMenuItemById = async (id) => {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: parseInt(id) }
  });

  if (!menuItem) {
    const err = new Error("Menu item not found");
    err.status = 404;
    throw err;
  }

  return menuItem;
}

exports.deleteMenuItem = (id) => {
  try {
    return prisma.menuItem.delete({
      where: { id: parseInt(id) }
    });
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error("Menu item not found");
      error.status = 404;
      throw error;
    }
    throw err;
  }

}