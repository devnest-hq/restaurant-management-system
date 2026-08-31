const prisma = require("../prisma/client");
const cloudinary = require("../config/cloudinary");

exports.createMenuItem = ({ name, category, price, description, imageUrl, imagePublicId }) => {
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
      imageUrl,
      imagePublicId
    }
  });
}

exports.updateMenuItem = async (id, { name, price, available, category, description, imageUrl, imagePublicId }) => {
  const existingItem = await prisma.menuItem.findUnique({ where: { id: parseInt(id) } });

  if (!existingItem) {
    const error = new Error("Menu item not found");
    error.status = 404;
    throw error;
  }

  let updatedItem;
  try {
    updatedItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        name,
        price,
        category,
        available,
        description,
        imageUrl,
        imagePublicId
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

  // Only delete the OLD image, and only after the DB update succeeded
  if (imagePublicId && existingItem.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(existingItem.imagePublicId);
    } catch (err) {
      console.error(err);
    }
  }

  return updatedItem;
};

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

exports.deleteMenuItem = async (id) => {
  const existingItem = await prisma.menuItem.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingItem) {
    const error = new Error("Menu item not found");
    error.status = 404;
    throw error;
  }

  if (existingItem.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(existingItem.imagePublicId);
    } catch (err) {
      console.error(err);
    }
  }

  try {
    return await prisma.menuItem.delete({
      where: { id: parseInt(id) }
    });
  } catch (err) {
    if (err.code === "P2025") {
      const error = new Error("Menu item not found");
      error.status = 404;
      throw error;
    }

    throw err;
  }
};