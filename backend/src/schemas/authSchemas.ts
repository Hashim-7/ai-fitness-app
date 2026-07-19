import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ message: "Email and password are required" }) // This acts as the catch-all for missing types
    .min(1, "Email and password are required")
    .email("Invalid email format"),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .optional(),

  password: z
    .string({ message: "Email and password are required" }) // This acts as the catch-all for missing types
    .min(1, "Email and password are required")
    .min(
      8,
      "Password must be at least 8 characters and contain uppercase, lowercase, and a number",
    )
    .regex(
      /[A-Z]/,
      "Password must be at least 8 characters and contain uppercase, lowercase, and a number",
    )
    .regex(
      /[a-z]/,
      "Password must be at least 8 characters and contain uppercase, lowercase, and a number",
    )
    .regex(
      /[0-9]/,
      "Password must be at least 8 characters and contain uppercase, lowercase, and a number",
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
