const prisma = require("../prisma/client");
const cloudinary = require("../config/cloudinary");
const { getCache, setCache, deleteCachePattern } = require("../utils/cache");

exports.createMenuItem = async ({ name, category, price, description, imageUrl, imagePublicId }) => {
  if (!name || !category || !price) {
    const err = new Error("All fields are required");
    err.status = 400;
    throw err;
  }

  const item = await prisma.menuItem.create({
    data: {
      name,
      category,
      price,
      description,
      imageUrl,
      imagePublicId
    }
  });

  await deleteCachePattern("menu:*");
  return item;
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

  await deleteCachePattern("menu:*");
  return updatedItem;
};

exports.getAllMenuItems = async ({ category, available } = {}) => {
  const cacheKey = `menu:list:${category || "all"}:${available ?? "all"}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const where = {};
  if (category) where.category = category;
  if (available !== undefined) where.available = available === "true";

  const items = await prisma.menuItem.findMany({ where });
  await setCache(cacheKey, items, 300); // 5 min
  return items;
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

  let deleted;
  try {
    deleted = await prisma.menuItem.delete({
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

  await deleteCachePattern("menu:*");
  return deleted;
};