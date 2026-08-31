const reservationService = require("../services/reservations.service");
const getSafeErrorMessage = require("../utils/errorMessage");

exports.createReservation = async (req, res) => {
  try {
    const { tableId, date, timeSlot, guestCount } = req.body
    const customerId = req.user.userId;

    const reserved = await reservationService.createReservation(customerId, tableId, date, timeSlot, guestCount);

    res.status(201).json(reserved);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't reserve table") });
  }
}

exports.getAvailableTables = async (req, res) => {
  try {
    const { date, timeSlot } = req.query;
    const tables = await reservationService.getAvailableTables({ date, timeSlot });
    res.status(200).json(tables);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't fetch available tables") });
  }
}

exports.updateReservation = async (req, res) => {
  try {
    const reservation = await reservationService.updateReservation(req.params.id, req.body, req.user );
    res.status(200).json(reservation);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't update reservation") });
  }
}