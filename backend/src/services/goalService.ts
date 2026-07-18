import goalRepository from "../repositories/goalRepository";

class GoalService {
  /**
   * Get the authenticated user's goal
   */
  async getGoal(userId: string) {
    const goal = await goalRepository.findByUserId(userId);

    if (!goal) {
      throw new Error("Goal not found");
    }

    return goal;
  }

  /**
   * Create or update a user's goal
   * Goal is 1:1 with User, so this uses upsert.
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
    this.validateGoal(data);

    return goalRepository.upsertGoal(userId, data);
  }

  /**
   * Delete user's goal
   */
  async deleteGoal(userId: string) {
    const goal = await goalRepository.findByUserId(userId);

    if (!goal) {
      throw new Error("Goal not found");
    }

    return goalRepository.deleteGoal(userId);
  }

  /**
   * Business validation rules
   */
  private validateGoal(data: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
  }) {
    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat } = data;

    // Basic positive number checks
    if (
      dailyCalories <= 0 ||
      dailyProtein < 0 ||
      dailyCarbs < 0 ||
      dailyFat < 0
    ) {
      throw new Error("Invalid goal values");
    }

    /**
     * Macro calorie calculation:
     *
     * Protein = 4 kcal/g
     * Carbs   = 4 kcal/g
     * Fat     = 9 kcal/g
     */
    const macroCalories = dailyProtein * 4 + dailyCarbs * 4 + dailyFat * 9;

    /**
      Allow some tolerance because:
      - nutrition labels round values
      - users may not perfectly calculate macros
    */
    const tolerance = 0.15;

    const minimumCalories = dailyCalories * (1 - tolerance);

    const maximumCalories = dailyCalories * (1 + tolerance);

    if (macroCalories < minimumCalories || macroCalories > maximumCalories) {
      throw new Error("Macros do not match daily calorie target");
    }

    // Reasonable upper limits
    if (dailyCalories > 10000) {
      throw new Error("Daily calories are too high");
    }

    if (dailyProtein > 500) {
      throw new Error("Daily protein amount is too high");
    }

    if (dailyCarbs > 1000) {
      throw new Error("Daily carb amount is too high");
    }

    if (dailyFat > 500) {
      throw new Error("Daily fat amount is too high");
    }
  }
}

export default new GoalService();
