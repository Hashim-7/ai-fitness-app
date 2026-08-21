import prisma from "../lib/prisma";

interface CreateWorkoutItemData {
  workoutEntryId: string;
  exerciseId: string;
  sets?: number;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  caloriesBurned?: number;
  notes?: string;
}

class WorkoutRepository {
  async findEntryByDate(userId: string, date: Date) {
    return prisma.workoutEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  async findOrCreateEntryByDate(userId: string, date: Date) {
    let entry = await this.findEntryByDate(userId, date);

    if (!entry) {
      entry = await prisma.workoutEntry.create({
        data: {
          userId,
          date,
        },
        include: {
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
      });
    }

    return entry;
  }

  async createItem(data: CreateWorkoutItemData) {
    return prisma.workoutItem.create({
      data: {
        workoutEntryId: data.workoutEntryId,
        exerciseId: data.exerciseId,
        sets: data.sets || 1,
        reps: data.reps,
        weightKg: data.weightKg,
        durationSeconds: data.durationSeconds,
        caloriesBurned: data.caloriesBurned,
        notes: data.notes,
      },
      include: {
        exercise: true,
      },
    });
  }

  async findItemById(itemId: string) {
    return prisma.workoutItem.findUnique({
      where: { id: itemId },
      include: {
        workoutEntry: true,
        exercise: true,
      },
    });
  }

  async updateItem(itemId: string, data: Partial<CreateWorkoutItemData>) {
    return prisma.workoutItem.update({
      where: { id: itemId },
      data,
      include: {
        exercise: true,
      },
    });
  }

  async deleteItem(itemId: string) {
    return prisma.workoutItem.delete({
      where: { id: itemId },
    });
  }
}

export default new WorkoutRepository();
