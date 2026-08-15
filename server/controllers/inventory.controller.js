const inventoryService = require("../services/inventory.service");

exports.createInventoryItem = async (req, res) => {
  try {
    const inventoryItem = await inventoryService.createInventoryItem(req.body);
    res.status(201).json(inventoryItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllInventoryItems = async (req, res) => {
  try {
    const inventoryItems = await inventoryService.getAllInventoryItems();
    res.json(inventoryItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInventoryItemById = async (req, res) => {
  try {
    const inventoryItem = await inventoryService.getInventoryItemById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.json(inventoryItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await inventoryService.getLowStockItems();
    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const updatedInventoryItem = await inventoryService.updateInventoryItem(req.params.id, req.body);
    if (!updatedInventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.status(200).json(updatedInventoryItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const deletedInventoryItem = await inventoryService.deleteInventoryItem(req.params.id);
    if (!deletedInventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};