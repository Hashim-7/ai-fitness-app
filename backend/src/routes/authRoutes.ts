import { Router } from "express";
import authController from "../controllers/authController";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authLimiter, (req, res) =>
  authController.register(req, res),
);

router.post("/login", authLimiter, (req, res) =>
  authController.login(req, res),
);

export default router;
