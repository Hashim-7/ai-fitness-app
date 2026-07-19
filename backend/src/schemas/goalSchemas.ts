import { z } from "zod";

/**
 * PUT /goals/me
 *
 * Create or update user's nutrition goal
 */
export const upsertGoalSchema = z.object({
  dailyCalories: z
    .number({
      message: "Daily calories must be a number",
    })
    .positive("Invalid goal values") // Updated error string
    .max(10000, "Daily calories are too high"),

  dailyProtein: z
    .number({
      message: "Daily protein must be a number",
    })
    .nonnegative("Invalid goal values") // Updated error string
    .max(500, "Daily protein amount is too high"),

  dailyCarbs: z
    .number({
      message: "Daily carbs must be a number",
    })
    .nonnegative("Invalid goal values") // Updated error string
    .max(1000, "Daily carb amount is too high"),

  dailyFat: z
    .number({
      message: "Daily fat must be a number",
    })
    .nonnegative("Invalid goal values") // Updated error string
    .max(500, "Daily fat amount is too high"),
});

export type UpsertGoalInput = z.infer<typeof upsertGoalSchema>;
