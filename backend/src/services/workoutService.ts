import workoutRepository from "../repositories/workoutRepository";
import exerciseRepository from "../repositories/exerciseRepository";
import aiService from "./aiService";

interface AddWorkoutItemInput {
  date: Date;
  exerciseId: string;
  sets?: number;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  caloriesBurned?: number;
  notes?: string;
}

interface UpdateWorkoutItemInput {
  sets?: number;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  caloriesBurned?: number;
  notes?: string;
}

class WorkoutService {
  private normaliseDate(date: Date): Date {
    const normalised = new Date(date);
    normalised.setHours(0, 0, 0, 0);
    return normalised;
  }

  async getWorkout(userId: string, date: Date) {
    const workoutDate = this.normaliseDate(date);
    const entry = await workoutRepository.findEntryByDate(userId, workoutDate);

    if (!entry) {
      return {
        date: workoutDate,
        exercises: [],
        totals: {
          totalExercises: 0,
          totalSets: 0,
          totalReps: 0,
          totalWeightKg: 0,
          totalDurationSeconds: 0,
          totalCaloriesBurned: 0,
        },
      };
    }

    const totals = entry.exercises.reduce(
      (acc, item) => {
        acc.totalExercises += 1;
        acc.totalSets += item.sets || 0;
        acc.totalReps += item.reps || 0;
        acc.totalWeightKg += (item.weightKg || 0) * (item.reps || 1) * (item.sets || 1);
        acc.totalDurationSeconds += item.durationSeconds || 0;
        acc.totalCaloriesBurned += item.caloriesBurned || 0;
        return acc;
      },
      {
        totalExercises: 0,
        totalSets: 0,
        totalReps: 0,
        totalWeightKg: 0,
        totalDurationSeconds: 0,
        totalCaloriesBurned: 0,
      },
    );

    return {
      id: entry.id,
      date: entry.date,
      exercises: entry.exercises,
      totals,
    };
  }

  async addWorkoutItem(userId: string, input: AddWorkoutItemInput) {
    const { date, exerciseId, ...data } = input;
    const workoutDate = this.normaliseDate(date);

    const exercise = await exerciseRepository.findById(exerciseId);
    if (!exercise) {
      throw new Error("Exercise not found");
    }

    const entry = await workoutRepository.findOrCreateEntryByDate(userId, workoutDate);

    return workoutRepository.createItem({
      workoutEntryId: entry.id,
      exerciseId: exercise.id,
      ...data,
    });
  }

  async updateWorkoutItem(
    userId: string,
    itemId: string,
    input: UpdateWorkoutItemInput,
  ) {
    const item = await workoutRepository.findItemById(itemId);
    if (!item) {
      throw new Error("Workout item not found");
    }

    if (item.workoutEntry.userId !== userId) {
      throw new Error("Unauthorized access to workout item");
    }

    return workoutRepository.updateItem(itemId, input);
  }

  async deleteWorkoutItem(userId: string, itemId: string) {
    const item = await workoutRepository.findItemById(itemId);
    if (!item) {
      throw new Error("Workout item not found");
    }

    if (item.workoutEntry.userId !== userId) {
      throw new Error("Unauthorized access to workout item");
    }

    await workoutRepository.deleteItem(itemId);

    return {
      message: "Workout item deleted successfully",
    };
  }

  async analyseWorkoutFormVideo(
    userId: string,
    input: { s3Key: string; exerciseName?: string },
  ) {
    const result = await aiService.analyseWorkoutForm(input.s3Key, input.exerciseName);
    return result;
  }
}

export default new WorkoutService();
