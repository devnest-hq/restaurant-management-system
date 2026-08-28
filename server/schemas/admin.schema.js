const { z } = require("zod");

const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  role: z.enum(["CHEF", "WAITER"]),
});

const updateStaffSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(255).optional(),
  role: z.enum(["CHEF", "WAITER", "ADMIN"]).optional(),
});

module.exports = { createStaffSchema, updateStaffSchema };