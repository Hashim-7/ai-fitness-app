import { Router } from "express";
import weightLogController from "../controllers/weightLogController";
import authMiddleware from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import {
  createWeightLogSchema,
  updateWeightLogSchema,
} from "../schemas/weightLogSchemas";

const router = Router();

router.use(authMiddleware);

router.post("/", validate(createWeightLogSchema), (req, res) =>
  weightLogController.createWeightLog(req, res),
);

router.get("/", (req, res) => weightLogController.getWeightLogs(req, res));

router.get("/latest", (req, res) =>
  weightLogController.getLatestWeight(req, res),
);

router.get("/trend", (req, res) =>
  weightLogController.getWeightTrend(req, res),
);

router.get("/:id", (req, res) => weightLogController.getWeightLog(req, res));

router.patch("/:id", validate(updateWeightLogSchema), (req, res) =>
  weightLogController.updateWeightLog(req, res),
);

router.delete("/:id", (req, res) =>
  weightLogController.deleteWeightLog(req, res),
);

export default router;
