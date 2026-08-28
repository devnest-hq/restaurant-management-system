const express = require("express");
const router = express.Router();
const tablesController = require("../controllers/table.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");
const requirePasswordChange = require("../middleware/verify.password.change");

router.use(verify);
router.use(verifyRole(["ADMIN"]));
router.use(requirePasswordChange);

router.post("/", tablesController.createTable);
router.patch("/:id", tablesController.updateTableCapacity);
router.delete("/:id", tablesController.deleteTable);

module.exports = router;