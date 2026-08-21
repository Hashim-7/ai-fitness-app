import prisma from "../lib/prisma";
import { ExerciseCategory, MuscleGroup } from "../../generated/prisma/client";

interface CreateExerciseData {
  name: string;
  category?: ExerciseCategory;
  muscleGroup?: MuscleGroup;
  equipment?: string;
  createdByUserId?: string;
}

class ExerciseRepository {
  async search(
    query?: string,
    category?: ExerciseCategory,
    muscleGroup?: MuscleGroup,
    userId?: string,
  ) {
    const where: any = {};

    if (query) {
      where.name = {
        contains: query,
        mode: "insensitive",
      };
    }

    if (category) {
      where.category = category;
    }

    if (muscleGroup) {
      where.muscleGroup = muscleGroup;
    }

    // Official exercises (createdByUserId = null) OR user's own exercises
    where.OR = [
      { createdByUserId: null },
      ...(userId ? [{ createdByUserId: userId }] : []),
    ];

    return prisma.exercise.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(id: string) {
    return prisma.exercise.findUnique({
      where: { id },
    });
  }

  async create(data: CreateExerciseData) {
    return prisma.exercise.create({
      data: {
        name: data.name,
        category: data.category || ExerciseCategory.STRENGTH,
        muscleGroup: data.muscleGroup || MuscleGroup.FULL_BODY,
        equipment: data.equipment,
        createdByUserId: data.createdByUserId,
      },
    });
  }
}

export default new ExerciseRepository();
