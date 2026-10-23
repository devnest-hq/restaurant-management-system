import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.email().trim().max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters").max(100)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  email: z.email().trim().max(255),
  password: z.string().min(1, "password must have at least 1 character"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Password must have at least 1 character"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(100)
}).refine(data => data.oldPassword !== data.newPassword, {
  message: "New password must be different",
  path: ["newPassword"]
});