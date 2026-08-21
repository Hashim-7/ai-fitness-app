import { Response } from "express";
import workoutService from "../services/workoutService";
import { AuthRequest } from "../middleware/authMiddleware";

class WorkoutController {
  async getWorkout(req: AuthRequest, res: Response) {
    try {
      const dateStr = req.query.date as string;
      if (!dateStr) {
        return res.status(400).json({
          message: "Date query parameter is required",
        });
      }

      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format",
        });
      }

      const workout = await workoutService.getWorkout(req.userId!, parsedDate);
      return res.status(200).json(workout);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async addWorkoutItem(req: AuthRequest, res: Response) {
    try {
      const { date, ...data } = req.body;
      const item = await workoutService.addWorkoutItem(req.userId!, {
        ...data,
        date: new Date(date),
      });

      return res.status(201).json(item);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async updateWorkoutItem(req: AuthRequest, res: Response) {
    try {
      const item = await workoutService.updateWorkoutItem(
        req.userId!,
        req.params.id as string,
        req.body,
      );

      return res.status(200).json(item);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async deleteWorkoutItem(req: AuthRequest, res: Response) {
    try {
      const result = await workoutService.deleteWorkoutItem(
        req.userId!,
        req.params.id as string,
      );

      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async analyseForm(req: AuthRequest, res: Response) {
    try {
      const result = await workoutService.analyseWorkoutFormVideo(
        req.userId!,
        req.body,
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
    case "Exercise not found":
    case "Workout item not found":
      return res.status(404).json({
        message: error.message,
      });

    case "Unauthorized access to workout item":
      return res.status(403).json({
        message: error.message,
      });

    default:
      return res.status(500).json({
        message: error.message || "Internal server error",
      });
  }
}

export default new WorkoutController();
