const inventoryService = require("../services/inventory.service");
const getSafeErrorMessage = require("../utils/errorMessage");

exports.createInventoryItem = async (req, res) => {
  try {
    const inventoryItem = await inventoryService.createInventoryItem(req.body);
    res.status(201).json(inventoryItem);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't create inventory item") });
  }
};

// Bulk create inventory items
exports.createInventoryItems = async (req, res) => {
  try {
    const { items } = req.body;

    const result = await inventoryService.createInventoryItems(items);

    return res.status(201).json({
      success: true,
      message: `${result.count} inventory items created successfully`,
      data: result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: getSafeErrorMessage(err, "Couldn't create inventory items"),
    });
  }
};

exports.getAllInventoryItems = async (req, res) => {
  try {
    const inventoryItems = await inventoryService.getAllInventoryItems();
    res.status(200).json(inventoryItems);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't fetch inventory items") });
  }
};

exports.getInventoryItemById = async (req, res) => {
  try {
    const inventoryItem = await inventoryService.getInventoryItemById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.status(200).json(inventoryItem);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't fetch inventory item") });
  }
};

exports.getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await inventoryService.getLowStockItems();
    res.status(200).json(lowStockItems);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't fetch low stock items") });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const updatedInventoryItem = await inventoryService.updateInventoryItem(req.params.id, req.body);
    if (!updatedInventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.status(200).json(updatedInventoryItem);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't update inventory item") });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const deletedInventoryItem = await inventoryService.deleteInventoryItem(req.params.id);
    if (!deletedInventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't delete inventory item") });
  }
};