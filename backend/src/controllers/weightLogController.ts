import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import weightLogService from "../services/weightLogService";

class WeightLogController {
  /**
   * POST /weight-logs
   *
   * Create a new weight log
   */
  async createWeightLog(req: AuthRequest, res: Response) {
    try {
      const { weightKg, date } = req.body;

      const result = await weightLogService.createWeightLog(req.userId!, {
        weightKg,
        date: date ? new Date(date) : undefined,
      });

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  /**
   * GET /weight-logs
   *
   * Get authenticated user's weight logs
   *
   * Query params:
   * ?page=1
   * ?limit=20
   * ?startDate=2025-01-01
   * ?endDate=2025-02-01
   */
  async getWeightLogs(req: AuthRequest, res: Response) {
    try {
      const { page, limit, startDate, endDate } = req.query;

      const result = await weightLogService.getWeightLogs(req.userId!, {
        page: page ? Number(page) : undefined,

        limit: limit ? Number(limit) : undefined,

        startDate: startDate ? new Date(startDate as string) : undefined,

        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  /**
   * GET /weight-logs/:id
   *
   * Get a single weight log
   */
  async getWeightLog(req: AuthRequest, res: Response) {
    try {
      const weightLogId = req.params.id as string;

      const result = await weightLogService.getWeightLog(
        req.userId!,
        weightLogId,
      );

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === "Weight log not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Unauthorized access to weight log") {
        return res.status(403).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }
  }

  /**
   * PATCH /weight-logs/:id
   *
   * Update weight log
   */
  async updateWeightLog(req: AuthRequest, res: Response) {
    try {
      const weightLogId = req.params.id as string;
      const { weightKg, date } = req.body;

      const result = await weightLogService.updateWeightLog(
        req.userId!,
        weightLogId,
        {
          weightKg,

          date: date ? new Date(date) : undefined,
        },
      );

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === "Weight log not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Unauthorized access to weight log") {
        return res.status(403).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }
  }

  /**
   * DELETE /weight-logs/:id
   *
   * Delete weight log
   */
  async deleteWeightLog(req: AuthRequest, res: Response) {
    try {
      const weightLogId = req.params.id as string;

      await weightLogService.deleteWeightLog(req.userId!, weightLogId);

      return res.status(200).json({
        message: "Weight log deleted successfully",
      });
    } catch (error: any) {
      if (error.message === "Weight log not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Unauthorized access to weight log") {
        return res.status(403).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }
  }

  /**
   * GET /weight-logs/latest
   *
   * Get user's latest weight
   */
  async getLatestWeight(req: AuthRequest, res: Response) {
    try {
      const result = await weightLogService.getLatestWeight(req.userId!);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(404).json({
        message: error.message,
      });
    }
  }

  /**
   * GET /weight-logs/trend
   *
   * Get weight change trend
   */
  async getWeightTrend(req: AuthRequest, res: Response) {
    try {
      const result = await weightLogService.getWeightTrend(req.userId!);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }
}

export default new WeightLogController();
