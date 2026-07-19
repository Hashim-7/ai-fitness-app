import { Response } from "express";
import diaryService from "../services/diaryService";
import { AuthRequest } from "../middleware/authMiddleware";

class DiaryController {
  /**
   * GET /api/diaries?date=YYYY-MM-DD
   */
  async getDiary(req: AuthRequest, res: Response) {
    try {
      const date = req.query.date as string;

      if (!date) {
        return res.status(400).json({
          message: "Date query parameter is required",
        });
      }

      const parsedDate = new Date(date);

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format",
        });
      }

      const diary = await diaryService.getDiary(req.userId!, parsedDate);

      return res.status(200).json(diary);
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * POST /api/diaries/items
   */
  async addDiaryItem(req: AuthRequest, res: Response) {
    try {
      const { date, foodId, mealType, servings } = req.body;

      if (!date || !foodId || !mealType || servings === undefined) {
        return res.status(400).json({
          message: "date, foodId, mealType and servings are required",
        });
      }

      const parsedDate = new Date(date);

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format",
        });
      }

      const item = await diaryService.addDiaryItem(req.userId!, {
        date: parsedDate,
        foodId,
        mealType,
        servings,
      });

      return res.status(201).json(item);
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * PATCH /api/diaries/items/:id
   */
  async updateDiaryItem(req: AuthRequest, res: Response) {
    try {
      const itemId = req.params.id as string;

      const { servings, mealType } = req.body;

      const item = await diaryService.updateDiaryItem(req.userId!, itemId, {
        servings,
        mealType,
      });

      return res.status(200).json(item);
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * DELETE /api/diaries/items/:id
   */
  async deleteDiaryItem(req: AuthRequest, res: Response) {
    try {
      const itemId = req.params.id as string;

      const result = await diaryService.deleteDiaryItem(req.userId!, itemId);

      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }
}

function handleError(error: unknown, res: Response) {
  if (!(error instanceof Error)) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }

  switch (error.message) {
    case "Food not found":
    case "Diary item not found":
      return res.status(404).json({
        message: error.message,
      });

    case "Unauthorized access to diary item":
      return res.status(403).json({
        message: error.message,
      });

    case "Food ID is required":
    case "Meal type is required":
    case "Servings must be greater than zero":
    case "Date query parameter is required":
    case "Invalid date format":
      return res.status(400).json({
        message: error.message,
      });

    default:
      return res.status(500).json({
        message: "Internal server error",
      });
  }
}

export default new DiaryController();
