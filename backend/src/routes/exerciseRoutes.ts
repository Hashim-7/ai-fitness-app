import { Router } from "express";
import exerciseController from "../controllers/exerciseController";
import authMiddleware from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { createExerciseSchema } from "../schemas/workoutSchemas";

const router = Router();

router.use(authMiddleware);

router.get("/", exerciseController.getExercises);
router.post("/", validate(createExerciseSchema), exerciseController.createExercise);

export default router;
