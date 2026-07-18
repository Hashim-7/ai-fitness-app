import { Router } from "express";
import goalController from "../controllers/goalController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

// All goal routes require authentication
router.use(authMiddleware);

// GET current user's goal
router.get("/me", (req, res) => goalController.getGoal(req, res));

// Create/update goal
router.put("/me", (req, res) => goalController.upsertGoal(req, res));

// Delete goal
router.delete("/me", (req, res) => goalController.deleteGoal(req, res));

export default router;
