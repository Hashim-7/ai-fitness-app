import { Router } from "express";
import authController from "../controllers/authController";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../schemas/authSchemas";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), (req, res) =>
  authController.register(req, res),
);

router.post("/login", authLimiter, validate(loginSchema), (req, res) =>
  authController.login(req, res),
);

router.post("/logout", (req, res) => authController.logout(req, res));

export default router;
