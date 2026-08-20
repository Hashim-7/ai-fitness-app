import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

import app from "../src/app";
import prisma from "../src/lib/prisma";

const AI_S3_KEY = process.env.AI_TEST_S3_KEY;

describe("AI meal analysis integration", () => {
  let token: string;

  beforeAll(async () => {
    if (!AI_S3_KEY) {
      throw new Error(
        "AI_TEST_S3_KEY environment variable is required for the AI integration test",
      );
    }

    const email = `ai-test-${Date.now()}@example.com`;
    const username = `ai-test-${Date.now()}`;

    const response = await request(app).post("/auth/register").send({
      email,
      username,
      password: "Password123",
    });

    expect(response.status).toBe(201);

    token = response.body.token;

    if (!token) {
      throw new Error("Registration did not return a JWT");
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should analyse a real meal image through the backend", async () => {
    const response = await request(app)
      .post("/diaries/analyse-photo")
      .set("Authorization", `Bearer ${token}`)
      .send({
        s3Key: AI_S3_KEY,
        date: "2026-08-20",
        mealType: "LUNCH",
      });

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty("foods");
    expect(response.body).toHaveProperty("total_calories");
    expect(response.body).toHaveProperty("total_protein");
    expect(response.body).toHaveProperty("total_carbs");
    expect(response.body).toHaveProperty("total_fat");

    expect(Array.isArray(response.body.foods)).toBe(true);
    expect(response.body.foods.length).toBeGreaterThan(0);

    for (const food of response.body.foods) {
      expect(food).toHaveProperty("name");
      expect(food).toHaveProperty("estimated_grams");
      expect(food).toHaveProperty("calories");
      expect(food).toHaveProperty("protein");
      expect(food).toHaveProperty("carbs");
      expect(food).toHaveProperty("fat");
      expect(food).toHaveProperty("confidence");

      expect(typeof food.name).toBe("string");
      expect(typeof food.estimated_grams).toBe("number");
      expect(typeof food.calories).toBe("number");
      expect(typeof food.protein).toBe("number");
      expect(typeof food.carbs).toBe("number");
      expect(typeof food.fat).toBe("number");
      expect(typeof food.confidence).toBe("number");

      expect(food.confidence).toBeGreaterThanOrEqual(0);
      expect(food.confidence).toBeLessThanOrEqual(1);
    }

    const calculatedCalories = response.body.foods.reduce(
      (sum: number, food: { calories: number }) => sum + food.calories,
      0,
    );

    const calculatedProtein = response.body.foods.reduce(
      (sum: number, food: { protein: number }) => sum + food.protein,
      0,
    );

    const calculatedCarbs = response.body.foods.reduce(
      (sum: number, food: { carbs: number }) => sum + food.carbs,
      0,
    );

    const calculatedFat = response.body.foods.reduce(
      (sum: number, food: { fat: number }) => sum + food.fat,
      0,
    );

    expect(response.body.total_calories).toBeCloseTo(calculatedCalories);
    expect(response.body.total_protein).toBeCloseTo(calculatedProtein);
    expect(response.body.total_carbs).toBeCloseTo(calculatedCarbs);
    expect(response.body.total_fat).toBeCloseTo(calculatedFat);
  }, 120000);
});
