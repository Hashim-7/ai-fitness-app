import { z } from "zod";

/**
 * POST /foods
 *
 * Create custom food
 */
export const createFoodSchema = z.object({
  name: z.string().min(1, "Food name is required").trim(),

  brand: z.string().trim().optional(),

  barcode: z.string().trim().optional(),

  servingSize: z
    .number({
      message: "Serving size must be a number",
    })
    .positive("Serving size must be greater than zero"),

  servingUnit: z.string().min(1, "Serving unit is required").trim(),

  calories: z
    .number({
      message: "Calories must be a number",
    })
    .nonnegative("Calories cannot be negative"),

  protein: z
    .number({
      message: "Protein must be a number",
    })
    .nonnegative("Protein cannot be negative"),

  carbs: z
    .number({
      message: "Carbohydrates must be a number",
    })
    .nonnegative("Carbohydrates cannot be negative"),

  fat: z
    .number({
      message: "Fat must be a number",
    })
    .nonnegative("Fat cannot be negative"),
});

/**
 * PATCH /foods/:id
 *
 * Update custom food
 */
export const updateFoodSchema = z
  .object({
    name: z.string().min(1, "Food name is required").trim().optional(),

    brand: z.string().trim().optional(),

    barcode: z.string().trim().optional(),

    servingSize: z
      .number({
        message: "Serving size must be a number",
      })
      .positive("Serving size must be greater than zero")
      .optional(),

    servingUnit: z
      .string()
      .min(1, "Serving unit is required")
      .trim()
      .optional(),

    calories: z
      .number({
        message: "Calories must be a number",
      })
      .nonnegative("Calories cannot be negative")
      .optional(),

    protein: z
      .number({
        message: "Protein must be a number",
      })
      .nonnegative("Protein cannot be negative")
      .optional(),

    carbs: z
      .number({
        message: "Carbohydrates must be a number",
      })
      .nonnegative("Carbohydrates cannot be negative")
      .optional(),

    fat: z
      .number({
        message: "Fat must be a number",
      })
      .nonnegative("Fat cannot be negative")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * GET /foods
 *
 * Search foods query params
 */
export const searchFoodSchema = z.object({
  name: z.string().trim().optional(),

  barcode: z.string().trim().optional(),

  page: z.coerce.number().int().positive().optional(),

  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Params validation
 *
 * GET /foods/:id
 * PATCH /foods/:id
 * DELETE /foods/:id
 */
export const foodIdSchema = z.object({
  id: z.string().min(1, "Food ID is required"),
});

export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;
export type SearchFoodInput = z.infer<typeof searchFoodSchema>;
