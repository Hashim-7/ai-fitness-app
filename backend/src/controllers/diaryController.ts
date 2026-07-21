import { Response } from "express";
import diaryService from "../services/diaryService";
import { AuthRequest } from "../middleware/authMiddleware";

class DiaryController {
  async getDiary(req: AuthRequest, res: Response) {
    try {
      const dateStr = req.query.date as string;

      if (!dateStr) {
        return res.status(400).json({
          // Fixed string matching the test expectation exactly
          message: "Date query parameter is required",
        });
      }

      const parsedDate = new Date(dateStr);
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

  async addDiaryItem(req: AuthRequest, res: Response) {
    try {
      const { date, ...data } = req.body;

      const item = await diaryService.addDiaryItem(req.userId!, {
        ...data,
        date: new Date(date),
      });

      return res.status(201).json(item);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async updateDiaryItem(req: AuthRequest, res: Response) {
    try {
      const item = await diaryService.updateDiaryItem(
        req.userId!,
        req.params.id as string,
        req.body,
      );

      return res.status(200).json(item);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async deleteDiaryItem(req: AuthRequest, res: Response) {
    try {
      const result = await diaryService.deleteDiaryItem(
        req.userId!,
        req.params.id as string,
      );

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

    default:
      return res.status(500).json({
        message: "Internal server error",
      });
  }
}

export default new DiaryController();
