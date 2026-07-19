import { Router } from "express";
import diaryController from "../controllers/diaryController";
import authMiddleware from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";

import {
  addDiaryItemSchema,
  updateDiaryItemSchema,
} from "../schemas/diarySchemas";

const router = Router();

router.use(authMiddleware);

router.get("/", diaryController.getDiary);

router.post(
  "/items",
  validate(addDiaryItemSchema),
  diaryController.addDiaryItem,
);

router.patch(
  "/items/:id",
  validate(updateDiaryItemSchema),
  diaryController.updateDiaryItem,
);

router.delete("/items/:id", diaryController.deleteDiaryItem);

export default router;
