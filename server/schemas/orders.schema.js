const { z } = require("zod");

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.number().int().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Order must include at least one item"),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"]),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };