const tableService = require("../services/table.service");

exports.createTable = async (req, res) => {
  try {
    const table = await tableService.createTable(req.body);
    res.status(201).json(table);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "cannont create table" });
  }
}

exports.updateTableCapacity = async (req, res) => {
  try {
    const id = req.params.id;
    const capacity = req.body.capacity;
    const table = await tableService.updateTableCapacity(id, capacity);
    res.status(200).json(table);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Cannot update table capacity " });
  }
}

exports.deleteTable = async (req, res) => {
  try {
    const table = await tableService.deleteTable(req.params.id);
    res.status(200).json(table);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "cannot delete table" });
  }
}