const { z } = require("zod");

const createTableSchema = z.object({
  tableNumber: z.number().int().positive(),
  capacity: z.number().int().positive(),
});

const updateTableCapacitySchema = z.object({
  capacity: z.number().int().positive(),
});

module.exports = { createTableSchema, updateTableCapacitySchema };