const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");
const upload = require("../config/multer");

router.use(verify);

router.post("/", verifyRole(["ADMIN", "CHEF"]), upload.single("imageUrl"), menuController.createMenuItem);
router.get("/", verifyRole(["ADMIN", "CHEF", "WAITER", "CUSTOMER"]), menuController.getAllMenuItems);
router.get("/:id", verifyRole(["ADMIN", "CHEF", "WAITER", "CUSTOMER"]), menuController.getMenuItemById);
router.patch("/:id", verifyRole(["ADMIN"]), upload.single("imageUrl"), menuController.updateMenuItem);
router.delete("/:id", verifyRole(["ADMIN"]), menuController.deleteMenuItem);

module.exports = router;