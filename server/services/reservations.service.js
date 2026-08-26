const prisma = require("../prisma/client");

exports.createReservation = async(customerId, tableId, date, timeSlot, guestCount) => {
  if (!date || !timeSlot || !guestCount) {
    const err = new Error("All fields are required ");
    err.status = 400;
    throw err;
  }

  const table = await prisma.table.findUnique({
    where: { id: parseInt(tableId) }
  });

  if (!table) {
    const err = new Error("Table not found");
    err.status = 400;
    throw err;
  }

  if (guestCount > table.capacity) {
    const err = new Error(`Guest count exceeds table capacity max (${table.capacity})`);
    err.status = 400;
    throw err;
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
    return reservation;
  } catch (err) {
    if (err.code === "P2002") {
      const error = new Error("This table is already booked for that time and date");
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

 
exports.getAvailableTables = async({ date, timeSlot }) => {
  if (!date || !timeSlot) {
    const err = new Error("Date and time slot are required");
    err.status = 400;
    throw err;
  }
  
  const availableTables = await prisma.table.findMany({
    where: {
      reservations: {
        none: {
          date: new Date(date),
          timeSlot
        }
      }
    }
  });
  
  return availableTables;
}
 

exports.updateReservation = async (id, { action, date, timeSlot, guestCount }, user) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: parseInt(id) }
  });

  if (!reservation) {
    const err = new Error("Reservation not found");
    err.status = 400;
    throw err;
  }

  const table = await prisma.table.findUnique({
    where: { id: reservation.tableId }
  });

  if (guestCount !== undefined && guestCount > table.capacity) {
    const err = new Error(`Guest count exceeds table capacity max (${table.capacity})`);
    err.status = 400;
    throw err;
  }
  
  const isOwner = reservation.customerId === user.userId;
  const isAdmin = user.role === "ADMIN";
  
  if (!isOwner && !isAdmin) {
    const err = new Error("You do not have permission to modify thus reservation ");
    err.status = 400;
    throw err;
  }
  
  if (action === "cancel") {
    await prisma.reservation.delete({
      where: { id: parseInt(id) }
    });
    return { message: "Reservation cancelled" }
  }
  
  try {
    const data = {};
    if (date !== undefined) data.date = new Date(date);
    if (timeSlot !== undefined) data.timeSlot = timeSlot;
    if (guestCount !== undefined) data.guestCount = guestCount;

    return await prisma.reservation.update({
      where: { id: parseInt(id) },
      data
    });
  } catch (err) {
    if (err.code === "P2002") {
      const error = new Error("This table is already booked for that time and date");
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

