const menuServices = require("../services/menu.service");
const getSafeErrorMessage = require("../utils/errorMessage");

exports.createMenuItem = async (req, res) => {
  try {
    const imageUrl = req.file ? req.file.path : undefined;
    const imagePublicId = req.file ? req.file.filename : undefined;
    const { name, category, price, description } = req.body;  
    const menuItem = await menuServices.createMenuItem({ name, category, price, description, imageUrl, imagePublicId });
    res.status(201).json({ menuItem });
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't create menu item") });
  }
}

exports.updateMenuItem = async (req, res) => {
  try {
    const id = req.params.id;
    const imageUrl = req.file ? req.file.path : undefined;
    const imagePublicId = req.file ? req.file.filename : undefined;
    const { name, category, price, description, available } = req.body;
    const updatedMenuItem = await menuServices.updateMenuItem(id, { name, category, price, description, available, imageUrl, imagePublicId });
    res.status(200).json(updatedMenuItem);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't update menu item") });
  }
}

exports.getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await menuServices.getAllMenuItems(req.query);
    res.status(200).json(menuItems);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't fetch menu items") });
  }
}

exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await menuServices.getMenuItemById(req.params.id);
    res.status(200).json(menuItem)
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't fetch menu item") });
  }
}

exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await menuServices.deleteMenuItem(req.params.id);
    res.status(200).json(item);
  } catch(err)  {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't delete menu item") });
  }
}