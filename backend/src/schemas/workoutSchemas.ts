import { z } from "zod";
import { ExerciseCategory, MuscleGroup } from "../../generated/prisma/client";

/**
 * GET /api/workouts?date=YYYY-MM-DD
 */
export const getWorkoutSchema = z.object({
  date: z
    .string()
    .min(1, "Date query parameter is required")
    .refine(
      (value) => !isNaN(new Date(value).getTime()),
      "Invalid date format",
    ),
});

/**
 * POST /api/exercises
 */
export const createExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),

  category: z
    .nativeEnum(ExerciseCategory, {
      message: "Invalid exercise category",
    })
    .optional()
    .default(ExerciseCategory.STRENGTH),

  muscleGroup: z
    .nativeEnum(MuscleGroup, {
      message: "Invalid muscle group",
    })
    .optional()
    .default(MuscleGroup.FULL_BODY),

  equipment: z.string().optional(),
});

/**
 * POST /api/workouts/items
 */
export const addWorkoutItemSchema = z.object({
  date: z
    .string()
    .min(1, "Date is required")
    .refine(
      (value) => !isNaN(new Date(value).getTime()),
      "Invalid date format",
    ),

  exerciseId: z.string().min(1, "Exercise ID is required"),

  sets: z
    .number({ message: "Sets must be a number" })
    .int("Sets must be an integer")
    .positive("Sets must be at least 1")
    .optional()
    .default(1),

  reps: z
    .number({ message: "Reps must be a number" })
    .int("Reps must be an integer")
    .nonnegative("Reps cannot be negative")
    .optional(),

  weightKg: z
    .number({ message: "Weight must be a number" })
    .nonnegative("Weight cannot be negative")
    .optional(),

  durationSeconds: z
    .number({ message: "Duration must be a number" })
    .int("Duration must be an integer")
    .nonnegative("Duration cannot be negative")
    .optional(),

  caloriesBurned: z
    .number({ message: "Calories burned must be a number" })
    .int("Calories burned must be an integer")
    .nonnegative("Calories burned cannot be negative")
    .optional(),

  notes: z.string().optional(),
});

/**
 * PATCH /api/workouts/items/:id
 */
export const updateWorkoutItemSchema = z
  .object({
    sets: z
      .number({ message: "Sets must be a number" })
      .int("Sets must be an integer")
      .positive("Sets must be at least 1")
      .optional(),

    reps: z
      .number({ message: "Reps must be a number" })
      .int("Reps must be an integer")
      .nonnegative("Reps cannot be negative")
      .optional(),

    weightKg: z
      .number({ message: "Weight must be a number" })
      .nonnegative("Weight cannot be negative")
      .optional(),

    durationSeconds: z
      .number({ message: "Duration must be a number" })
      .int("Duration must be an integer")
      .nonnegative("Duration cannot be negative")
      .optional(),

    caloriesBurned: z
      .number({ message: "Calories burned must be a number" })
      .int("Calories burned must be an integer")
      .nonnegative("Calories burned cannot be negative")
      .optional(),

    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      data.sets !== undefined ||
      data.reps !== undefined ||
      data.weightKg !== undefined ||
      data.durationSeconds !== undefined ||
      data.caloriesBurned !== undefined ||
      data.notes !== undefined,
    {
      message: "At least one field must be provided for update",
    },
  );

/**
 * POST /api/workouts/analyse-form
 */
export const analyseFormSchema = z.object({
  s3Key: z.string().min(1, "S3 key is required"),
  exerciseName: z.string().optional(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type AddWorkoutItemInput = z.infer<typeof addWorkoutItemSchema>;
export type UpdateWorkoutItemInput = z.infer<typeof updateWorkoutItemSchema>;
