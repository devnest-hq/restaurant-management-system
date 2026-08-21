const adminService = require("../services/admin.service");

exports.createStaff = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await adminService.createStaff(name, email, role);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const staff = await adminService.getAllStaff();
    if (!staff || staff.length === 0) {
      return res.status(404).json({ error: "No staff members found" });
    }
    res.status(200).json(staff);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await adminService.getStaffById(id);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.status(200).json(staff);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const updatedStaff = await adminService.updateStaff(id, name, email, role);
    if (!updatedStaff) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    if (updatedStaff.error) {
      return res.status(400).json(updatedStaff);
    }
    res.status(200).json(updatedStaff);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staffId = Number(id);

    if (!Number.isInteger(staffId) || staffId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const deletedStaff = await adminService.deleteStaff(staffId);

    if (!deletedStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff member deleted successfully",
      data: deletedStaff,
    });
  } catch (err) {
    console.error("Delete staff error:", err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Internal server error",
    });
  }
};


exports.mostOrderedMenuItems = async (req, res) => {
  try {
    const limit = req.query.limit
      ? Number(req.query.limit)
      : 5;

    if (!Number.isInteger(limit) || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a positive integer",
      });
    }

    const mostOrderedItems =
      await adminService.mostOrderedMenuItems(limit);

    return res.status(200).json({
      success: true,
      data: mostOrderedItems,
    });
  } catch (err) {
    console.error("Most ordered menu items error:", err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Internal server error",
    });
  }
};


exports.salesReport = async (req, res) => {
  try {
    const period = req.query.period || "daily";

    const allowedPeriods = ["daily", "weekly", "monthly"];

    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid period. Period must be daily, weekly, or monthly",
      });
    }

    const report = await adminService.salesReport(period);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("Sales report error:", err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Internal server error",
    });
  }
};


exports.dashboardStats = async (req, res) => {
  try {
    const stats = await adminService.dashboardData();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Internal server error",
    });
  }
};
