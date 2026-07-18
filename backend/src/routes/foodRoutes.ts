import { Router } from "express";
import foodController from "../controllers/foodController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.post("/", foodController.create);

router.get("/", foodController.search);

router.get("/favourites", foodController.getFavourites);

router.get("/:id", foodController.getById);

router.patch("/:id", foodController.update);

router.delete("/:id", foodController.delete);

router.post("/:id/favourite", foodController.addFavourite);

router.delete("/:id/favourite", foodController.removeFavourite);

export default router;
