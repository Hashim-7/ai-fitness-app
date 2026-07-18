import weightLogRepository from "../repositories/weightLogRepository";

class WeightLogService {
  /**
   * Create a new weight log
   */
  async createWeightLog(
    userId: string,
    data: {
      weightKg: number;
      date?: Date;
    },
  ) {
    this.validateWeight(data.weightKg);

    if (data.date) {
      this.validateDate(data.date);
    }

    return weightLogRepository.create(userId, data);
  }

  /**
   * Get all weight logs for authenticated user
   *
   * Supports:
   * - pagination
   * - date filtering
   */
  async getWeightLogs(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return weightLogRepository.findByUserId(userId, options);
  }

  /**
   * Get a single weight log
   *
   * Includes ownership check.
   */
  async getWeightLog(userId: string, weightLogId: string) {
    const weightLog = await weightLogRepository.findById(weightLogId);

    if (!weightLog) {
      throw new Error("Weight log not found");
    }

    if (weightLog.userId !== userId) {
      throw new Error("Unauthorized access to weight log");
    }

    return weightLog;
  }

  /**
   * Update a weight log
   *
   * User can only update their own logs.
   */
  async updateWeightLog(
    userId: string,
    weightLogId: string,
    data: {
      weightKg?: number;
      date?: Date;
    },
  ) {
    const weightLog = await weightLogRepository.findById(weightLogId);

    if (!weightLog) {
      throw new Error("Weight log not found");
    }

    if (weightLog.userId !== userId) {
      throw new Error("Unauthorized access to weight log");
    }

    if (data.weightKg !== undefined) {
      this.validateWeight(data.weightKg);
    }

    if (data.date !== undefined) {
      this.validateDate(data.date);
    }

    return weightLogRepository.update(weightLogId, data);
  }

  /**
   * Delete a weight log
   */
  async deleteWeightLog(userId: string, weightLogId: string) {
    const weightLog = await weightLogRepository.findById(weightLogId);

    if (!weightLog) {
      throw new Error("Weight log not found");
    }

    if (weightLog.userId !== userId) {
      throw new Error("Unauthorized access to weight log");
    }

    return weightLogRepository.delete(weightLogId);
  }

  /**
   * Get latest recorded weight
   *
   * Useful for dashboard/profile stats.
   */
  async getLatestWeight(userId: string) {
    const logs = await weightLogRepository.findByUserId(userId, {
      page: 1,
      limit: 1,
    });

    if (logs.length === 0) {
      throw new Error("No weight logs found");
    }

    return logs[0];
  }

  /**
   * Calculate weight trend
   *
   * Returns difference between latest and oldest log.
   *
   * Positive = gained weight
   * Negative = lost weight
   */
  async getWeightTrend(userId: string) {
    const logs = await weightLogRepository.findByUserId(userId, {
      page: 1,
      limit: 100,
    });

    if (logs.length < 2) {
      throw new Error("Not enough weight logs to calculate trend");
    }

    const latest = logs[0];
    const oldest = logs[logs.length - 1];

    return {
      startWeight: oldest.weightKg,
      currentWeight: latest.weightKg,
      difference: latest.weightKg - oldest.weightKg,
    };
  }

  /**
   * Validate weight values
   */
  private validateWeight(weightKg: number) {
    if (weightKg <= 0) {
      throw new Error("Weight must be greater than zero");
    }

    // Prevent unrealistic values
    if (weightKg > 500) {
      throw new Error("Weight value is too high");
    }
  }

  /**
   * Validate dates
   */
  private validateDate(date: Date) {
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    // Prevent future weight logs
    if (date > new Date()) {
      throw new Error("Weight log date cannot be in the future");
    }
  }
}

export default new WeightLogService();
