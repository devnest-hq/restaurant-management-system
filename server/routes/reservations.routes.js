const express = require("express");
const router = express.Router();
const reservationsController = require("../controllers/reservations.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");
const requirePasswordChange = require("../middleware/verify.password.change");
const { validate, validateParams } = require("../middleware/validate");
const { createReservationSchema, updateReservationSchema } = require("../schemas/reservations.schema");
const { idParamSchema } = require("../schemas/common.schema");

router.use(verify);
router.use(requirePasswordChange);

router.get("/availability", reservationsController.getAvailableTables);
router.post("/", verifyRole(["CUSTOMER"]), validate(createReservationSchema), reservationsController.createReservation);
router.patch("/:id", validateParams(idParamSchema), validate(updateReservationSchema), reservationsController.updateReservation);

module.exports = router;