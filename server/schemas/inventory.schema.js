const { z } = require("zod");

const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  quantity: z.number().int().min(0),
  unit: z.string().trim().min(1).max(50),
  lowStockThreshold: z.number().int().min(0),
  supplier: z.string().trim().max(150).optional(),
});

const updateInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().trim().min(1).max(50).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  supplier: z.string().trim().max(150).optional(),
});

const createInventoryItemsBulkSchema = z.object({
  items: z.array(createInventoryItemSchema).min(1, "Items must be a non-empty array"),
});

module.exports = { createInventoryItemSchema, updateInventoryItemSchema, createInventoryItemsBulkSchema };