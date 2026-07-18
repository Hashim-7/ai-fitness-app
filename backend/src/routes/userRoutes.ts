import { Router } from "express";
import userController from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/me", (req, res) => userController.getProfile(req, res));

router.patch("/me", (req, res) => userController.updateProfile(req, res));

router.delete("/me", (req, res) => userController.deleteProfile(req, res));

export default router;
