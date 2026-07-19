import { Router } from "express";
import userController from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { updateProfileSchema } from "../schemas/userSchemas";

const router = Router();

router.use(authMiddleware);

router.get("/me", (req, res) => userController.getProfile(req, res));

router.patch("/me", validate(updateProfileSchema), (req, res) =>
  userController.updateProfile(req, res),
);

router.delete("/me", (req, res) => userController.deleteProfile(req, res));

export default router;
