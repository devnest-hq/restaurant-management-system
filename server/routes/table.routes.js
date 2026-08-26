const express = require("express");
const router = express.Router();
const tablesController = require("../controllers/table.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");

router.use(verify);
router.use(verifyRole(["ADMIN"]));

router.post("/table", reservationsController.createTable);
router.patch("/table/:id", reservationsController.updateTableCapacity);
router.delete("/table/:id", reservationsController.deleteTable);

module.exports = router;