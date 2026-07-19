import { z } from "zod";
import { MealType } from "../../generated/prisma/client";

/**
 * GET /api/diaries?date=YYYY-MM-DD
 */
export const getDiarySchema = z.object({
  date: z
    .string()
    .min(1, "Date query parameter is required")
    .refine(
      (value) => !isNaN(new Date(value).getTime()),
      "Invalid date format",
    ),
});

/**
 * POST /api/diaries/items
 */
export const addDiaryItemSchema = z.object({
  date: z
    .string()
    .min(1, "Date is required")
    .refine(
      (value) => !isNaN(new Date(value).getTime()),
      "Invalid date format",
    ),

  foodId: z.string().min(1, "Food ID is required"),

  mealType: z.nativeEnum(MealType, {
    message: "Invalid meal type",
  }),

  servings: z
    .number({
      message: "Servings must be a number",
    })
    .positive("Servings must be greater than zero"),
});

/**
 * PATCH /api/diaries/items/:id
 */
export const updateDiaryItemSchema = z
  .object({
    servings: z
      .number({
        message: "Servings must be a number",
      })
      .positive("Servings must be greater than zero")
      .optional(),

    mealType: z
      .nativeEnum(MealType, {
        message: "Invalid meal type",
      })
      .optional(),
  })
  .refine(
    (data) => data.servings !== undefined || data.mealType !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export type AddDiaryItemInput = z.infer<typeof addDiaryItemSchema>;
export type UpdateDiaryItemInput = z.infer<typeof updateDiaryItemSchema>;
export type GetDiaryInput = z.infer<typeof getDiarySchema>;
