import { Router } from "express";
import goalController from "../controllers/goalController";
import authMiddleware from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { upsertGoalSchema } from "../schemas/goalSchemas";

const router = Router();

router.use(authMiddleware);

router.get("/me", (req, res) => goalController.getGoal(req, res));

router.put("/me", validate(upsertGoalSchema), (req, res) =>
  goalController.upsertGoal(req, res),
);

router.delete("/me", (req, res) => goalController.deleteGoal(req, res));

export default router;
