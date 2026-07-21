import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import goalService from "../services/goalService";

class GoalController {
  /**
   * GET /goals/me
   * Get authenticated user's goal
   */
  async getGoal(req: AuthRequest, res: Response) {
    try {
      const result = await goalService.getGoal(req.userId!);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(404).json({
        message: error.message,
      });
    }
  }

  /**
   * PUT /goals/me
   * Create or update authenticated user's goal
   */
  async upsertGoal(req: AuthRequest, res: Response) {
    try {
      const { dailyCalories, dailyProtein, dailyCarbs, dailyFat } = req.body;

      const result = await goalService.upsertGoal(req.userId!, {
        dailyCalories,
        dailyProtein,
        dailyCarbs,
        dailyFat,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  /**
   * DELETE /goals/me
   * Delete authenticated user's goal
   */
  async deleteGoal(req: AuthRequest, res: Response) {
    try {
      const result = await goalService.deleteGoal(req.userId!);

      return res.status(200).json({
        message: "Goal deleted successfully",
      });
    } catch (error: any) {
      return res.status(404).json({
        message: error.message,
      });
    }
  }
}

export default new GoalController();
