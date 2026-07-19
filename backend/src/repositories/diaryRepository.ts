import { MealType } from "../../generated/prisma/client";
import prisma from "../lib/prisma";

class DiaryRepository {
  /**
   * Find a diary entry for a user on a specific date.
   */
  async findEntryByDate(userId: string, date: Date) {
    return prisma.diaryEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      include: {
        meals: {
          include: {
            food: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  /**
   * Find or create a diary entry for a user on a specific date.
   */
  async findOrCreateEntryByDate(userId: string, date: Date) {
    return prisma.diaryEntry.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {},
      create: {
        userId,
        date,
      },
    });
  }

  /**
   * Find a diary entry by ID.
   */
  async findEntryById(id: string) {
    return prisma.diaryEntry.findUnique({
      where: { id },
      include: {
        meals: {
          include: {
            food: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  /**
   * Find a diary item by ID.
   */
  async findItemById(id: string) {
    return prisma.diaryItem.findUnique({
      where: { id },
      include: {
        food: true,
        diaryEntry: true,
      },
    });
  }

  /**
   * Create a diary item.
   */
  async createItem(data: {
    diaryEntryId: string;
    foodId: string;
    mealType: MealType;
    servings: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) {
    return prisma.diaryItem.create({
      data,
      include: {
        food: true,
      },
    });
  }

  /**
   * Update a diary item.
   */
  async updateItem(
    id: string,
    data: {
      mealType?: MealType;
      servings?: number;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    },
  ) {
    return prisma.diaryItem.update({
      where: { id },
      data,
      include: {
        food: true,
      },
    });
  }

  /**
   * Delete a diary item.
   */
  async deleteItem(id: string) {
    return prisma.diaryItem.delete({
      where: { id },
    });
  }

  /**
   * Get all diary items for a diary entry.
   */
  async findItemsByEntryId(diaryEntryId: string) {
    return prisma.diaryItem.findMany({
      where: {
        diaryEntryId,
      },
      include: {
        food: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }
}

export default new DiaryRepository();
