const express = require("express");
const router = express.Router();
const reservationsController = require("../controllers/reservations.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");

router.use(verify);

router.get("/availability", reservationsController.getAvailableTables);
router.post("/", verifyRole(["CUSTOMER"]), reservationsController.createReservation);
router.patch("/:id", reservationsController.updateReservation);

module.exports = router;