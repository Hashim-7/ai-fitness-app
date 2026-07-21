import { Router } from "express";
import foodController from "../controllers/foodController";
import authMiddleware from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";

import {
  createFoodSchema,
  updateFoodSchema,
  searchFoodSchema,
  foodIdSchema,
} from "../schemas/foodSchemas";

const router = Router();

router.use(authMiddleware);

router.post("/", validate(createFoodSchema), foodController.create);

router.get("/", foodController.search);

router.get("/favourites", foodController.getFavourites);

router.get("/:id", foodController.getById);

router.patch("/:id", validate(updateFoodSchema), foodController.update);

router.delete("/:id", foodController.delete);

router.post("/:id/favourite", foodController.addFavourite);

router.delete("/:id/favourite", foodController.removeFavourite);

export default router;
