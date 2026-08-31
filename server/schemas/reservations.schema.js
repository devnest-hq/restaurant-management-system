const { z } = require("zod");

const createReservationSchema = z.object({
  tableId: z.number().int().positive(),
  date: z.string().min(1),
  timeSlot: z.string().min(1),
  guestCount: z.number().int().positive(),
});

const updateReservationSchema = z.object({
  tableId: z.number().int().positive().optional(),
  date: z.string().min(1).optional(),
  timeSlot: z.string().min(1).optional(),
  guestCount: z.number().int().positive().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED"]).optional(),
});

module.exports = { createReservationSchema, updateReservationSchema };