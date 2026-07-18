import foodRepository from "../repositories/foodRepository";

class FoodService {
  /**
   * Create a custom food
   */
  async createFood(
    userId: string,
    data: {
      name: string;
      brand?: string;
      barcode?: string;
      servingSize: number;
      servingUnit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
  ) {
    this.validateFood(data);

    if (data.barcode) {
      const existing = await foodRepository.findByBarcode(data.barcode);

      if (existing) {
        throw new Error("Barcode already exists");
      }
    }

    return foodRepository.create(userId, data);
  }

  /**
   * Search foods
   */
  async searchFoods(
    userId: string,
    options?: {
      name?: string;
      barcode?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return foodRepository.search(userId, options);
  }

  /**
   * Get food by id
   */
  async getFood(foodId: string) {
    const food = await foodRepository.findById(foodId);

    if (!food) {
      throw new Error("Food not found");
    }

    return food;
  }

  /**
   * Update a custom food
   */
  async updateFood(
    userId: string,
    foodId: string,
    data: {
      name?: string;
      brand?: string;
      barcode?: string;
      servingSize?: number;
      servingUnit?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    },
  ) {
    const food = await foodRepository.findById(foodId);

    if (!food) {
      throw new Error("Food not found");
    }

    // Official foods cannot be edited
    if (food.createdByUserId === null) {
      throw new Error("Official foods cannot be modified");
    }

    if (food.createdByUserId !== userId) {
      throw new Error("Unauthorized access to food");
    }

    if (data.barcode && data.barcode !== food.barcode) {
      const existing = await foodRepository.findByBarcode(data.barcode);

      if (existing) {
        throw new Error("Barcode already exists");
      }
    }

    this.validateFood(data);

    return foodRepository.update(foodId, data);
  }

  /**
   * Delete a custom food
   */
  async deleteFood(userId: string, foodId: string) {
    const food = await foodRepository.findById(foodId);

    if (!food) {
      throw new Error("Food not found");
    }

    if (food.createdByUserId === null) {
      throw new Error("Official foods cannot be deleted");
    }

    if (food.createdByUserId !== userId) {
      throw new Error("Unauthorized access to food");
    }

    return foodRepository.delete(foodId);
  }

  /**
   * Favourite a food
   */
  async addFavourite(userId: string, foodId: string) {
    const food = await foodRepository.findById(foodId);

    if (!food) {
      throw new Error("Food not found");
    }

    const favourite = await foodRepository.findFavourite(userId, foodId);

    if (favourite) {
      throw new Error("Food already favourited");
    }

    return foodRepository.addFavourite(userId, foodId);
  }

  /**
   * Remove favourite
   */
  async removeFavourite(userId: string, foodId: string) {
    const favourite = await foodRepository.findFavourite(userId, foodId);

    if (!favourite) {
      throw new Error("Favourite not found");
    }

    return foodRepository.removeFavourite(userId, foodId);
  }

  /**
   * List favourite foods
   */
  async getFavouriteFoods(userId: string) {
    return foodRepository.listFavourites(userId);
  }

  /**
   * Validate food fields
   */
  private validateFood(data: {
    name?: string;
    servingSize?: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }) {
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error("Food name is required");
    }

    if (data.servingSize !== undefined && data.servingSize <= 0) {
      throw new Error("Serving size must be greater than zero");
    }

    if (data.calories !== undefined && data.calories < 0) {
      throw new Error("Calories cannot be negative");
    }

    if (data.protein !== undefined && data.protein < 0) {
      throw new Error("Protein cannot be negative");
    }

    if (data.carbs !== undefined && data.carbs < 0) {
      throw new Error("Carbohydrates cannot be negative");
    }

    if (data.fat !== undefined && data.fat < 0) {
      throw new Error("Fat cannot be negative");
    }
  }
}

export default new FoodService();
