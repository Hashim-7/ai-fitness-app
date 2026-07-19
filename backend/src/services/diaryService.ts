import { MealType } from "../../generated/prisma/client";
import diaryRepository from "../repositories/diaryRepository";
import foodRepository from "../repositories/foodRepository";
import goalRepository from "../repositories/goalRepository";

interface AddDiaryItemInput {
  date: Date;
  foodId: string;
  mealType: MealType;
  servings: number;
}

interface UpdateDiaryItemInput {
  servings?: number;
  mealType?: MealType;
}

class DiaryService {
  /**
   * Normalise a date so only the calendar day is stored.
   * Prevents duplicate diary entries caused by differing times.
   */
  private normaliseDate(date: Date): Date {
    const normalised = new Date(date);

    normalised.setHours(0, 0, 0, 0);

    return normalised;
  }

  /**
   * Calculate nutrition snapshot for a diary item.
   *
   * Food values are stored per servingSize.
   *
   * Example:
   *
   * Food:
   * servingSize = 100g
   * calories = 150
   *
   * User logs:
   * servings = 2
   *
   * Snapshot calories = 300
   */
  private calculateNutrition(
    food: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
    servings: number,
  ) {
    return {
      calories: Math.round(food.calories * servings),
      protein: Math.round(food.protein * servings),
      carbs: Math.round(food.carbs * servings),
      fat: Math.round(food.fat * servings),
    };
  }

  /**
   * Get diary for a specific date.
   *
   * Returns:
   * - diary entry
   * - diary items
   * - nutrition totals
   * - user's goal (if one exists)
   */
  async getDiary(userId: string, date: Date) {
    const diaryDate = this.normaliseDate(date);

    const entry = await diaryRepository.findEntryByDate(userId, diaryDate);

    const goal = await goalRepository.findByUserId(userId);

    if (!entry) {
      return {
        date: diaryDate,

        items: [],

        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },

        goal,

        remaining: goal
          ? {
              calories: goal.dailyCalories,
              protein: goal.dailyProtein,
              carbs: goal.dailyCarbs,
              fat: goal.dailyFat,
            }
          : null,
      };
    }

    const totals = entry.meals.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;

        return acc;
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    );

    return {
      id: entry.id,

      date: entry.date,

      items: entry.meals,

      totals,

      goal,

      remaining: goal
        ? {
            calories: goal.dailyCalories - totals.calories,
            protein: goal.dailyProtein - totals.protein,
            carbs: goal.dailyCarbs - totals.carbs,
            fat: goal.dailyFat - totals.fat,
          }
        : null,
    };
  }

  /**
   * Add food to diary.
   *
   * Flow:
   * 1. Validate input
   * 2. Find food
   * 3. Create/find diary entry for date
   * 4. Calculate nutrition snapshot
   * 5. Create diary item
   */
  async addDiaryItem(userId: string, input: AddDiaryItemInput) {
    const { date, foodId, mealType, servings } = input;

    const diaryDate = this.normaliseDate(date);

    /**
     * Get food being logged.
     *
     * Food itself does not need ownership checking:
     * - official foods (createdByUserId = null)
     * - user's custom foods
     *
     * Both can be logged by anyone.
     */
    const food = await foodRepository.findById(foodId);

    if (!food) {
      throw new Error("Food not found");
    }

    /**
     * Create diary entry if this is the first item
     * logged for this date.
     */
    const diaryEntry = await diaryRepository.findOrCreateEntryByDate(
      userId,
      diaryDate,
    );

    /**
     * Snapshot nutrition at logging time.
     *
     * Important:
     * If Food changes later,
     * existing diary history remains unchanged.
     */
    const nutrition = this.calculateNutrition(food, servings);

    return diaryRepository.createItem({
      diaryEntryId: diaryEntry.id,

      foodId: food.id,

      mealType,

      servings,

      calories: nutrition.calories,

      protein: nutrition.protein,

      carbs: nutrition.carbs,

      fat: nutrition.fat,
    });
  }

  /**
   * Update a diary item.
   *
   * Rules:
   * - User can only update their own diary items
   * - Changing servings recalculates nutrition snapshot
   * - Changing meal type does not affect nutrition
   */
  async updateDiaryItem(
    userId: string,
    itemId: string,
    input: UpdateDiaryItemInput,
  ) {
    const item = await diaryRepository.findItemById(itemId);

    if (!item) {
      throw new Error("Diary item not found");
    }

    /**
     * Ownership check.
     *
     * DiaryItem belongs to DiaryEntry,
     * DiaryEntry belongs to User.
     */
    if (item.diaryEntry.userId !== userId) {
      throw new Error("Unauthorized access to diary item");
    }

    const updateData: {
      servings?: number;
      mealType?: MealType;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    } = {};

    /**
     * Update meal type if supplied.
     */
    if (input.mealType) {
      updateData.mealType = input.mealType;
    }

    /**
     * If servings change,
     * recalculate the nutrition snapshot.
     */
    if (input.servings !== undefined) {
      updateData.servings = input.servings;

      const nutrition = this.calculateNutrition(item.food, input.servings);

      updateData.calories = nutrition.calories;

      updateData.protein = nutrition.protein;

      updateData.carbs = nutrition.carbs;

      updateData.fat = nutrition.fat;
    }

    return diaryRepository.updateItem(itemId, updateData);
  }

  /**
   * Delete a diary item.
   *
   * Only the owner of the diary can delete it.
   */
  async deleteDiaryItem(userId: string, itemId: string) {
    const item = await diaryRepository.findItemById(itemId);

    if (!item) {
      throw new Error("Diary item not found");
    }

    /**
     * Ownership check.
     */
    if (item.diaryEntry.userId !== userId) {
      throw new Error("Unauthorized access to diary item");
    }

    await diaryRepository.deleteItem(itemId);

    return {
      message: "Diary item deleted successfully",
    };
  }
}

export default new DiaryService();
