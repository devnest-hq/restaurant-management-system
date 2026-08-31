const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const menuItemIngredientController = require("../controllers/menuItemIngredient.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");
const requirePasswordChange = require("../middleware/verify.password.change");
const upload = require("../config/multer");
const { validate, validateParams } = require("../middleware/validate");
const { createMenuItemSchema, updateMenuItemSchema } = require("../schemas/menu.schema");
const { idParamSchema } = require("../schemas/common.schema");

router.use(verify);
router.use(requirePasswordChange);

router.post(
  "/",
  verifyRole(["ADMIN", "CHEF"]),
  upload.single("imageUrl"),
  validate(createMenuItemSchema),
  menuController.createMenuItem
);

router.post(
  "/:id/ingredients",
  verifyRole(["ADMIN", "CHEF"]),
  validateParams(idParamSchema),
  menuItemIngredientController.addIngredientsToMenuItem
);

router.get(
  "/",
  verifyRole(["ADMIN", "CHEF", "WAITER", "CUSTOMER"]),
  menuController.getAllMenuItems
);

router.get(
  "/:id",
  verifyRole(["ADMIN", "CHEF", "WAITER", "CUSTOMER"]),
  validateParams(idParamSchema),
  menuController.getMenuItemById
);

router.patch(
  "/:id",
  verifyRole(["ADMIN"]),
  upload.single("imageUrl"),
  validateParams(idParamSchema),
  validate(updateMenuItemSchema),
  menuController.updateMenuItem
);

router.delete(
  "/:id",
  verifyRole(["ADMIN"]),
  validateParams(idParamSchema),
  menuController.deleteMenuItem
);

module.exports = router;