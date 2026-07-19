import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

describe("Diary Routes", () => {
  let token: string;
  let secondToken: string;

  let userId: string;
  let secondUserId: string;

  beforeEach(async () => {
    await prisma.diaryItem.deleteMany();
    await prisma.diaryEntry.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.food.deleteMany();
    await prisma.user.deleteMany();

    const user = await request(app).post("/auth/register").send({
      email: "test@example.com",
      username: "testuser",
      password: "Password123",
    });

    token = user.body.token;

    userId = (await prisma.user.findUnique({
      where: {
        email: "test@example.com",
      },
    }))!.id;

    const secondUser = await request(app).post("/auth/register").send({
      email: "other@example.com",
      username: "otheruser",
      password: "Password123",
    });

    secondToken = secondUser.body.token;

    secondUserId = (await prisma.user.findUnique({
      where: {
        email: "other@example.com",
      },
    }))!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createFood() {
    return prisma.food.create({
      data: {
        name: "Chicken Breast",
        brand: "Tesco",

        servingSize: 100,
        servingUnit: "g",

        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 4,
      },
    });
  }

  describe("GET /diaries", () => {
    it("should return empty diary when no entries exist", async () => {
      const response = await request(app)
        .get("/diaries?date=2026-01-01")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.items).toEqual([]);

      expect(response.body.totals.calories).toBe(0);
    });

    it("should return diary items and totals", async () => {
      const food = await createFood();

      await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: food.id,
          mealType: "BREAKFAST",
          servings: 2,
        });

      const response = await request(app)
        .get("/diaries?date=2026-01-01")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.items.length).toBe(1);

      expect(response.body.totals.calories).toBe(330);

      expect(response.body.totals.protein).toBe(62);
    });

    it("should reject missing date", async () => {
      const response = await request(app)
        .get("/diaries")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);

      expect(response.body.message).toBe("Date query parameter is required");
    });

    it("should reject invalid date", async () => {
      const response = await request(app)
        .get("/diaries?date=hello")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);

      expect(response.body.message).toBe("Invalid date format");
    });
  });

  describe("POST /diaries/items", () => {
    it("should add food to diary", async () => {
      const food = await createFood();

      const response = await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: food.id,
          mealType: "LUNCH",
          servings: 1,
        });

      expect(response.status).toBe(201);

      expect(response.body.foodId).toBe(food.id);

      expect(response.body.calories).toBe(165);
    });

    it("should create diary entry automatically", async () => {
      const food = await createFood();

      await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: food.id,
          mealType: "DINNER",
          servings: 1,
        });

      const entry = await prisma.diaryEntry.findFirst({
        where: {
          userId,
        },
      });

      expect(entry).not.toBeNull();
    });

    it("should reject missing food", async () => {
      const response = await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          mealType: "DINNER",
          servings: 1,
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid servings", async () => {
      const food = await createFood();

      const response = await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: food.id,
          mealType: "DINNER",
          servings: 0,
        });

      expect(response.status).toBe(400);

      expect(response.body.message).toBe("Servings must be greater than zero");
    });

    it("should reject non-existent food", async () => {
      const response = await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: "fake-id",
          mealType: "DINNER",
          servings: 1,
        });

      expect(response.status).toBe(404);

      expect(response.body.message).toBe("Food not found");
    });
  });

  describe("PATCH /diaries/items/:id", () => {
    it("should update servings and recalculate nutrition", async () => {
      const food = await createFood();

      const created = await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: food.id,
          mealType: "BREAKFAST",
          servings: 1,
        });

      const response = await request(app)
        .patch(`/diaries/items/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          servings: 3,
        });

      expect(response.status).toBe(200);

      expect(response.body.servings).toBe(3);

      expect(response.body.calories).toBe(495);
    });

    it("should update meal type", async () => {
      const food = await createFood();

      const created = await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: food.id,
          mealType: "BREAKFAST",
          servings: 1,
        });

      const response = await request(app)
        .patch(`/diaries/items/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          mealType: "DINNER",
        });

      expect(response.status).toBe(200);

      expect(response.body.mealType).toBe("DINNER");
    });

    it("should prevent another user editing diary item", async () => {
      const food = await createFood();

      const created = await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: food.id,
          mealType: "BREAKFAST",
          servings: 1,
        });

      const response = await request(app)
        .patch(`/diaries/items/${created.body.id}`)
        .set("Authorization", `Bearer ${secondToken}`)
        .send({
          servings: 5,
        });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /diaries/items/:id", () => {
    it("should delete own diary item", async () => {
      const food = await createFood();

      const created = await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: food.id,
          mealType: "SNACK",
          servings: 1,
        });

      const response = await request(app)
        .delete(`/diaries/items/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      const item = await prisma.diaryItem.findUnique({
        where: {
          id: created.body.id,
        },
      });

      expect(item).toBeNull();
    });

    it("should prevent another user deleting diary item", async () => {
      const food = await createFood();

      const created = await request(app)
        .post("/diaries/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-01-01",
          foodId: food.id,
          mealType: "SNACK",
          servings: 1,
        });

      const response = await request(app)
        .delete(`/diaries/items/${created.body.id}`)
        .set("Authorization", `Bearer ${secondToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Authentication", () => {
    it("should reject missing token", async () => {
      const response = await request(app).get("/diaries?date=2026-01-01");

      expect(response.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const response = await request(app)
        .get("/diaries?date=2026-01-01")
        .set("Authorization", "Bearer invalidtoken");

      expect(response.status).toBe(401);
    });
  });
});
