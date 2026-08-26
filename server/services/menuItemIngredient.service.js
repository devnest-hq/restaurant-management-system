const prisma = require("../prisma/client");

exports.addIngredientsToMenuItem = async (menuItemId, ingredients) => {
  const id = parseInt(menuItemId);

  if (isNaN(id)) {
    const error = new Error("Invalid menu item ID");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    const error = new Error("Ingredients must be a non-empty array");
    error.status = 400;
    throw error;
  }

  // Check that the menu item exists
  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!menuItem) {
    const error = new Error("Menu item not found");
    error.status = 404;
    throw error;
  }

  // Validate the ingredients
  for (const ingredient of ingredients) {
    if (
      !ingredient.inventoryItemId ||
      ingredient.quantityUsed === undefined
    ) {
      const error = new Error(
        "Each ingredient must have inventoryItemId and quantityUsed"
      );
      error.status = 400;
      throw error;
    }

    if (
      !Number.isInteger(ingredient.inventoryItemId) ||
      !Number.isInteger(ingredient.quantityUsed)
    ) {
      const error = new Error(
        "inventoryItemId and quantityUsed must be integers"
      );
      error.status = 400;
      throw error;
    }

    if (ingredient.quantityUsed <= 0) {
      const error = new Error(
        "quantityUsed must be greater than 0"
      );
      error.status = 400;
      throw error;
    }
  }

  // Check that all inventory items exist
  const inventoryIds = ingredients.map(
    (ingredient) => ingredient.inventoryItemId
  );

  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      id: {
        in: inventoryIds,
      },
    },
  });

  if (inventoryItems.length !== inventoryIds.length) {
    const foundIds = inventoryItems.map((item) => item.id);

    const missingIds = inventoryIds.filter(
      (id) => !foundIds.includes(id)
    );

    const error = new Error(
      `Inventory item(s) not found: ${missingIds.join(", ")}`
    );
    error.status = 404;
    throw error;
  }

  // Create all ingredient relationships
  return prisma.menuItemIngredient.createMany({
    data: ingredients.map((ingredient) => ({
      menuItemId: id,
      inventoryItemId: ingredient.inventoryItemId,
      quantityUsed: ingredient.quantityUsed,
    })),
  });
};