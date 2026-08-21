import { Response } from "express";
import exerciseService from "../services/exerciseService";
import { AuthRequest } from "../middleware/authMiddleware";
import { ExerciseCategory, MuscleGroup } from "../../generated/prisma/client";

class ExerciseController {
  async getExercises(req: AuthRequest, res: Response) {
    try {
      const query = req.query.name as string | undefined;
      const category = req.query.category as ExerciseCategory | undefined;
      const muscleGroup = req.query.muscleGroup as MuscleGroup | undefined;

      const exercises = await exerciseService.searchExercises(
        req.userId!,
        query,
        category,
        muscleGroup,
      );

      return res.status(200).json(exercises);
    } catch (error) {
      return res.status(500).json({
        message: "Failed to fetch exercises",
      });
    }
  }

  async createExercise(req: AuthRequest, res: Response) {
    try {
      const exercise = await exerciseService.createExercise(
        req.userId!,
        req.body,
      );

      return res.status(201).json(exercise);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Unable to create exercise",
      });
    }
  }
}

export default new ExerciseController();
