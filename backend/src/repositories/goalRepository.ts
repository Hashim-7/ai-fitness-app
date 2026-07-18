import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

class GoalRepository {
  /**
   * Get a user's goal
   */
  async findByUserId(userId: string) {
    return prisma.goal.findUnique({
      where: {
        userId,
      },
    });
  }

  /**
   * Create or update a user's goal
   * Since Goal has userId @unique, upsert is the correct operation.
   */
  async upsertGoal(
    userId: string,
    data: {
      dailyCalories: number;
      dailyProtein: number;
      dailyCarbs: number;
      dailyFat: number;
    },
  ) {
    return prisma.goal.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        dailyCalories: data.dailyCalories,
        dailyProtein: data.dailyProtein,
        dailyCarbs: data.dailyCarbs,
        dailyFat: data.dailyFat,
      },
      update: {
        dailyCalories: data.dailyCalories,
        dailyProtein: data.dailyProtein,
        dailyCarbs: data.dailyCarbs,
        dailyFat: data.dailyFat,
      },
    });
  }

  /**
   * Delete a user's goal
   */
  async deleteGoal(userId: string) {
    return prisma.goal.delete({
      where: {
        userId,
      },
    });
  }
}

export default new GoalRepository();
