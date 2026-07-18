import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

class WeightLogRepository {
  /**
   * Create a new weight log
   */
  async create(
    userId: string,
    data: {
      weightKg: number;
      date?: Date;
    },
  ) {
    return prisma.weightLog.create({
      data: {
        userId,
        weightKg: data.weightKg,
        date: data.date ?? new Date(),
      },
    });
  }

  /**
   * Get all weight logs belonging to a user
   *
   * Supports:
   * - pagination
   * - date filtering
   *
   */
  async findByUserId(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    return prisma.weightLog.findMany({
      where: {
        userId,

        date: {
          gte: options?.startDate,
          lte: options?.endDate,
        },
      },

      orderBy: {
        date: "desc",
      },

      skip: (page - 1) * limit,

      take: limit,
    });
  }

  /**
   * Find a single weight log by id
   */
  async findById(id: string) {
    return prisma.weightLog.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Update a weight log
   */
  async update(
    id: string,
    data: {
      weightKg?: number;
      date?: Date;
    },
  ) {
    return prisma.weightLog.update({
      where: {
        id,
      },

      data: {
        ...(data.weightKg !== undefined && {
          weightKg: data.weightKg,
        }),

        ...(data.date !== undefined && {
          date: data.date,
        }),
      },
    });
  }

  /**
   * Delete a weight log
   */
  async delete(id: string) {
    return prisma.weightLog.delete({
      where: {
        id,
      },
    });
  }
}

export default new WeightLogRepository();
