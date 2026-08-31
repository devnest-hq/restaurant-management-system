const express = require("express");
const router = express.Router();
const tablesController = require("../controllers/table.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");
const requirePasswordChange = require("../middleware/verify.password.change");
const { validate, validateParams } = require("../middleware/validate");
const { createTableSchema, updateTableCapacitySchema } = require("../schemas/table.schema");
const { idParamSchema } = require("../schemas/common.schema");

router.use(verify);
router.use(requirePasswordChange);
router.use(verifyRole(["ADMIN"]));

router.post("/", validate(createTableSchema), tablesController.createTable);
router.patch("/:id", validateParams(idParamSchema), validate(updateTableCapacitySchema), tablesController.updateTableCapacity);
router.delete("/:id", validateParams(idParamSchema), tablesController.deleteTable);

module.exports = router;