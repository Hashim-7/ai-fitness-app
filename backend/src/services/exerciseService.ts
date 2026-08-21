import exerciseRepository from "../repositories/exerciseRepository";
import { ExerciseCategory, MuscleGroup } from "../../generated/prisma/client";

interface CreateExerciseInput {
  name: string;
  category?: ExerciseCategory;
  muscleGroup?: MuscleGroup;
  equipment?: string;
}

class ExerciseService {
  async searchExercises(
    userId: string,
    query?: string,
    category?: ExerciseCategory,
    muscleGroup?: MuscleGroup,
  ) {
    return exerciseRepository.search(query, category, muscleGroup, userId);
  }

  async createExercise(userId: string, input: CreateExerciseInput) {
    if (!input.name || !input.name.trim()) {
      throw new Error("Exercise name is required");
    }

    return exerciseRepository.create({
      ...input,
      name: input.name.trim(),
      createdByUserId: userId,
    });
  }
}

export default new ExerciseService();
