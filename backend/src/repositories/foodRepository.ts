import prisma from "../lib/prisma";

class FoodRepository {
  /**
   * Create a custom food
   */
  async create(
    createdByUserId: string,
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
    return prisma.food.create({
      data: {
        ...data,
        createdByUserId,
      },
    });
  }

  /**
   * Find food by id
   */
  async findById(id: string) {
    return prisma.food.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Find food by barcode
   */
  async findByBarcode(barcode: string) {
    return prisma.food.findUnique({
      where: {
        barcode,
      },
    });
  }

  /**
   * Search foods
   *
   * Returns:
   * - Official foods
   * - Foods created by the current user
   */
  async search(
    userId: string,
    options?: {
      name?: string;
      barcode?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    return prisma.food.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                createdByUserId: null,
              },
              {
                createdByUserId: userId,
              },
            ],
          },

          options?.name
            ? {
                name: {
                  contains: options.name,
                  mode: "insensitive",
                },
              }
            : {},

          options?.barcode
            ? {
                barcode: options.barcode,
              }
            : {},
        ],
      },

      orderBy: {
        name: "asc",
      },

      skip: (page - 1) * limit,

      take: limit,
    });
  }

  /**
   * Update food
   */
  async update(
    id: string,
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
    return prisma.food.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * Delete food
   */
  async delete(id: string) {
    return prisma.food.delete({
      where: {
        id,
      },
    });
  }

  /**
   * Add favourite
   */
  async addFavourite(userId: string, foodId: string) {
    return prisma.userFoodFavourite.create({
      data: {
        userId,
        foodId,
      },
    });
  }

  /**
   * Remove favourite
   */
  async removeFavourite(userId: string, foodId: string) {
    return prisma.userFoodFavourite.delete({
      where: {
        userId_foodId: {
          userId,
          foodId,
        },
      },
    });
  }

  /**
   * Check if favourite exists
   */
  async findFavourite(userId: string, foodId: string) {
    return prisma.userFoodFavourite.findUnique({
      where: {
        userId_foodId: {
          userId,
          foodId,
        },
      },
    });
  }

  /**
   * List user's favourite foods
   */
  async listFavourites(userId: string) {
    return prisma.userFoodFavourite.findMany({
      where: {
        userId,
      },

      include: {
        food: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export default new FoodRepository();
