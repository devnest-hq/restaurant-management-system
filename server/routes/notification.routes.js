const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const verify = require("../middleware/verify.JWT");
const requirePasswordChange = require("../middleware/verify.password.change");
const { validateParams } = require("../middleware/validate");
const { idParamSchema } = require("../schemas/common.schema");

router.use(verify);
router.use(requirePasswordChange);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", validateParams(idParamSchema), notificationController.readNotification);
router.patch("/read-all", notificationController.readAllNotifications);

module.exports = router;