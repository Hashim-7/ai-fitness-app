import { Router } from "express";
import diaryController from "../controllers/diaryController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

/**
 * All diary routes require authentication.
 */
router.use(authMiddleware);

/**
 * GET /api/diaries?date=YYYY-MM-DD
 *
 * Get diary entry, logged foods,
 * nutrition totals and remaining goals.
 */
router.get("/", diaryController.getDiary);

/**
 * POST /api/diaries/items
 *
 * Add food to diary.
 *
 * Body:
 * {
 *   date: "2026-01-01",
 *   foodId: "...",
 *   mealType: "BREAKFAST",
 *   servings: 2
 * }
 */
router.post("/items", diaryController.addDiaryItem);

/**
 * PATCH /api/diaries/items/:id
 *
 * Update diary item.
 *
 * Body:
 * {
 *   servings?: number,
 *   mealType?: "LUNCH"
 * }
 */
router.patch("/items/:id", diaryController.updateDiaryItem);

/**
 * DELETE /api/diaries/items/:id
 *
 * Delete diary item.
 */
router.delete("/items/:id", diaryController.deleteDiaryItem);

export default router;
