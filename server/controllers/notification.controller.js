const notificationService = require("../services/notification.service");

exports.getNotifications = async (req, res) => {
  try {
     const userId = req.user.userId;
    const notification = await notificationService.getNotifications(userId);
    res.status(200).json(notification);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Error fetching notification" });
  }
}

exports.readNotification = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    const notification = await notificationService.readNotification(id, userId);
    res.status(200).json(notification);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Can't read notification" });
  }
}

exports.readAllNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    await notificationService.readAllNotifications(userId);
    res.status(200).json({ message: "All notifications read" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Can't read all notifications" });
  }
}