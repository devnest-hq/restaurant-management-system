const prisma = require("../prisma/client");
const { createNotification } = require("../services/notification.service");

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

exports.createReservation = async(customerId, tableId, date, timeSlot, guestCount) => {
  if (!date || !timeSlot || !guestCount) {
    throw httpError(400, "All fields are required");
  }

  if (!Number.isInteger(guestCount) || guestCount <= 0) {
    throw httpError(400, "Guest count must be a positive integer");
  }

  const table = await prisma.table.findUnique({
    where: { id: parseInt(tableId) }
  });

  if (!table) {
    throw httpError(400, "Table not found");
  }

  if (guestCount > table.capacity) {
    throw httpError(400, `Guest count exceeds table capacity max (${table.capacity})`);
  }

  try {
    const reservation = await prisma.reservation.create({
      data: {
        customerId,
        tableId: parseInt(tableId),
        date: new Date(date),
        timeSlot,
        guestCount
      }
    });

    try {
      await createNotification({
        userId: customerId,
        type: "Reservation",
        message: `Your reservation for table ${table.tableNumber} on ${date} at ${timeSlot} has been created.`
      });
    } catch (err) {
      console.error("Error creating notification:", err);
    }

    return reservation;
  } catch (err) {
    if (err.code === "P2002") {
      throw httpError(409, "This table is already booked for that time and date");
    }
    throw err;
  }
}

 
exports.getAvailableTables = async({ date, timeSlot }) => {
  if (!date || !timeSlot) {
    throw httpError(400, "Date and time slot are required");
  }
  
  const availableTables = await prisma.table.findMany({
    where: {
      reservations: {
        none: {
          date: new Date(date),
          timeSlot,
          status: { not: "CANCELLED" }
        }
      }
    }
  });
  
  return availableTables;
}
 

exports.updateReservation = async (id, { date, timeSlot, guestCount }, user) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: parseInt(id) },
    include: { table: true },
  });

  if (!reservation) {
    throw httpError(404, "Reservation not found");
  }

  if (reservation.status === "CANCELLED") {
    throw httpError(400, "Cannot update a cancelled reservation");
  }

  if (guestCount !== undefined && guestCount > reservation.table.capacity) {
    throw httpError(400, `Guest count exceeds table capacity max (${reservation.table.capacity})`);
  }
  
  const isOwner = reservation.customerId === user.userId;
  const isAdmin = user.role === "ADMIN";
  
  if (!isOwner && !isAdmin) {
    throw httpError(403, "You do not have permission to modify this reservation");
  }
  
  try {
    const data = {};
    if (date !== undefined) data.date = new Date(date);
    if (timeSlot !== undefined) data.timeSlot = timeSlot;
    if (guestCount !== undefined) data.guestCount = guestCount;

    const updatedReservation = await prisma.reservation.update({
      where: { id: parseInt(id) },
      data
    });

    await createNotification({
      userId: user.userId,
      type: "RESERVATION UPDATED",
      message: `Your Reservation for table ${reservation.table.tableNumber} on ${reservation.date} at ${reservation.timeSlot} has been updated.`
    });

    return updatedReservation;

  } catch (err) {
    if (err.code === "P2002") {
      throw httpError(409, "This table is already booked for that time and date");
    }
    throw err;
  }
}

exports.cancelReservation = async (id, user) => {
  const reservationId = Number(id);
  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    throw httpError(400, "Reservation id must be a positive integer");
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { table: true },
  });

  if (!reservation) {
    throw httpError(404, "Reservation not found");
  }

  const isOwner = reservation.customerId === user.userId;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    throw httpError(403, "You do not have permission to cancel this reservation");
  }

  if (reservation.status === "CANCELLED") {
    throw httpError(409, "Reservation is already cancelled");
  }
  if (!CANCELLABLE_STATUSES.includes(reservation.status)) {
    throw httpError(409, "This reservation can no longer be cancelled");
  }

  const cancelledReservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: { 
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: user.userId
    },
  });

  try {
    await createNotification({
      userId: reservation.customerId,
      type: "RESERVATION_CANCELLED",
      message: `Your reservation for table ${reservation.table.tableNumber} on ${reservation.date.toISOString().slice(0, 10)} at ${reservation.timeSlot} has been cancelled.`,
    });
  } catch (err) {
    console.error("Failed to create cancellation notification:", err.message);
  }

  return cancelledReservation;
};