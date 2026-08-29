const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const verify = require("../middleware/verify.JWT");

router.use(verify);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.readNotification);
router.patch("/read-all", notificationController.readAllNotifications);

module.exports = router;