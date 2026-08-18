const menuServices = require("../services/menu.service");

exports.createMenuItem = async (req, res) => {
  try {
    const imageUrl = req.file ? req.file.path : undefined;
    const { name, category, price, description } = req.body;  
    const menuItem = await menuServices.createMenuItem({ name, category, price, description, imageUrl });
    res.status(201).json(menuItem);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

exports.updateMenuItem = async (req, res) => {
  try {
    const id = req.params.id;
    const imageUrl = req.file ? req.file.path : undefined;
    const { name, category, price, description, available } = req.body;
    const updatedMenuItem = await menuServices.updateMenuItem(id, { name, category, price, description, available, imageUrl });
    res.status(200).json(updatedMenuItem);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Can't update menu item "});
  }
}

exports.getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await menuServices.getAllMenuItems(req.params);
    res.status(200).json(menuItems);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "can't fetch Menu items" })
  }
}

exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await menuServices.getMenuItemById(req.params.id);
    res.status(200).json(menuItem)
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await menuServices.deleteMenuItem(req.params.id);
    res.status(200).json(item);
  } catch(err)  {
    console.log(err);
    res.status(err.status || 500).json({ error: err.message });
  }
}