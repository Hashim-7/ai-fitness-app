import { Router } from "express";
import weightLogController from "../controllers/weightLogController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

// All weight log routes require authentication
router.use(authMiddleware);

/**
 * Create weight log
 *
 * POST /weight-logs
 */
router.post("/", (req, res) => weightLogController.createWeightLog(req, res));

/**
 * Get user's weight logs
 *
 * GET /weight-logs
 */
router.get("/", (req, res) => weightLogController.getWeightLogs(req, res));

/**
 * Latest weight
 *
 * GET /weight-logs/latest
 */
router.get("/latest", (req, res) =>
  weightLogController.getLatestWeight(req, res),
);

/**
 * Weight trend
 *
 * GET /weight-logs/trend
 */
router.get("/trend", (req, res) =>
  weightLogController.getWeightTrend(req, res),
);

/**
 * Get single weight log
 *
 * GET /weight-logs/:id
 */
router.get("/:id", (req, res) => weightLogController.getWeightLog(req, res));

/**
 * Update weight log
 *
 * PATCH /weight-logs/:id
 */
router.patch("/:id", (req, res) =>
  weightLogController.updateWeightLog(req, res),
);

/**
 * Delete weight log
 *
 * DELETE /weight-logs/:id
 */
router.delete("/:id", (req, res) =>
  weightLogController.deleteWeightLog(req, res),
);

export default router;
