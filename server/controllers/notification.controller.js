const notificationService = require("../services/notification.service");
const getSafeErrorMessage = require("../utils/errorMessage");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await notificationService.getNotifications(userId);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't fetch notifications") });
  }
}

exports.readNotification = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    const notification = await notificationService.readNotification(id, userId);
    res.status(200).json(notification);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't mark notification as read") });
  }
}

exports.readAllNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    await notificationService.readAllNotifications(userId);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't mark notifications as read") });
  }
}