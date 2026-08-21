import { Router } from "express";
import workoutController from "../controllers/workoutController";
import authMiddleware from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import {
  addWorkoutItemSchema,
  updateWorkoutItemSchema,
  analyseFormSchema,
} from "../schemas/workoutSchemas";

const router = Router();

router.use(authMiddleware);

router.get("/", workoutController.getWorkout);

router.post(
  "/items",
  validate(addWorkoutItemSchema),
  workoutController.addWorkoutItem,
);

router.patch(
  "/items/:id",
  validate(updateWorkoutItemSchema),
  workoutController.updateWorkoutItem,
);

router.delete("/items/:id", workoutController.deleteWorkoutItem);

router.post(
  "/analyse-form",
  validate(analyseFormSchema),
  workoutController.analyseForm,
);

export default router;
