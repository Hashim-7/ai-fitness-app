import { z } from "zod";

/**
 * POST /weight-logs
 *
 * Create a weight log
 */
export const createWeightLogSchema = z.object({
  weightKg: z
    .number({
      message: "Weight must be a number",
    })
    .positive("Weight must be greater than zero")
    .max(500, "Weight value is too high"),

  date: z.string().datetime("Invalid date format").optional(),
});

/**
 * PATCH /weight-logs/:id
 *
 * Update weight log
 */
export const updateWeightLogSchema = z
  .object({
    weightKg: z
      .number({
        message: "Weight must be a number",
      })
      .positive("Weight must be greater than zero")
      .max(500, "Weight value is too high")
      .optional(),

    date: z.string().datetime("Invalid date format").optional(),
  })
  .refine((data) => data.weightKg !== undefined || data.date !== undefined, {
    message: "At least one field must be provided",
  });

/**
 * GET /weight-logs
 *
 * Query parameters:
 * ?page=1
 * ?limit=20
 * ?startDate=2026-01-01
 * ?endDate=2026-02-01
 */
export const getWeightLogsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),

  limit: z.coerce.number().int().positive().max(100).optional(),

  startDate: z.string().datetime("Invalid start date format").optional(),

  endDate: z.string().datetime("Invalid end date format").optional(),
});

/**
 * Params:
 *
 * GET /weight-logs/:id
 * PATCH /weight-logs/:id
 * DELETE /weight-logs/:id
 */
export const weightLogIdSchema = z.object({
  id: z.string().min(1, "Weight log ID is required"),
});

export type CreateWeightLogInput = z.infer<typeof createWeightLogSchema>;

export type UpdateWeightLogInput = z.infer<typeof updateWeightLogSchema>;

export type GetWeightLogsInput = z.infer<typeof getWeightLogsSchema>;
