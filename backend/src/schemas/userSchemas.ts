import { z } from "zod";

/**
 * PATCH /users/me
 *
 * Update authenticated user's profile
 */
export const updateProfileSchema = z
  .object({
    email: z.string().email("Invalid email format").optional(),

    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .trim()
      .optional(),
  })
  .refine((data) => data.email !== undefined || data.username !== undefined, {
    message: "At least one field must be provided",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
