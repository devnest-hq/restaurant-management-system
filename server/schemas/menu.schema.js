const { z } = require("zod");

const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number().positive(),
});

const updateMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number().positive().optional(),
  available: z.coerce.boolean().optional(),
});

module.exports = { createMenuItemSchema, updateMenuItemSchema };