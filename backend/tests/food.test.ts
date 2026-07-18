import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

describe("Food Routes", () => {
  let token: string;
  let secondToken: string;
  let userId: string;
  let secondUserId: string;

  beforeEach(async () => {
    await prisma.userFoodFavourite.deleteMany();
    await prisma.diaryItem.deleteMany();
    await prisma.diaryEntry.deleteMany();
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

  async function createFood(createdByUserId = userId) {
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
        barcode: Math.random().toString(),
        createdByUserId,
      },
    });
  }

  describe("POST /foods", () => {
    it("should create a custom food", async () => {
      const response = await request(app)
        .post("/foods")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Rice",
          servingSize: 100,
          servingUnit: "g",
          calories: 130,
          protein: 2,
          carbs: 28,
          fat: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Rice");
    });

    it("should reject duplicate barcode", async () => {
      await createFood();

      const existing = await prisma.food.findFirst();

      const response = await request(app)
        .post("/foods")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Rice",
          barcode: existing!.barcode,
          servingSize: 100,
          servingUnit: "g",
          calories: 100,
          protein: 1,
          carbs: 20,
          fat: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Barcode already exists");
    });
  });

  describe("GET /foods", () => {
    it("should return searchable foods", async () => {
      await createFood();

      const response = await request(app)
        .get("/foods?name=Chicken")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });
  });

  describe("GET /foods/:id", () => {
    it("should return a food", async () => {
      const food = await createFood();

      const response = await request(app)
        .get(`/foods/${food.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(food.id);
    });

    it("should return 404 for missing food", async () => {
      const response = await request(app)
        .get("/foods/not-real")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /foods/:id", () => {
    it("should update own custom food", async () => {
      const food = await createFood();

      const response = await request(app)
        .patch(`/foods/${food.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          calories: 200,
        });

      expect(response.status).toBe(200);
      expect(response.body.calories).toBe(200);
    });

    it("should reject editing another user's food", async () => {
      const food = await createFood(secondUserId);

      const response = await request(app)
        .patch(`/foods/${food.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          calories: 200,
        });

      expect(response.status).toBe(403);
    });

    it("should reject editing official food", async () => {
      const food = await prisma.food.create({
        data: {
          name: "Apple",
          servingSize: 100,
          servingUnit: "g",
          calories: 50,
          protein: 1,
          carbs: 12,
          fat: 0,
        },
      });

      const response = await request(app)
        .patch(`/foods/${food.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          calories: 100,
        });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /foods/:id", () => {
    it("should delete own food", async () => {
      const food = await createFood();

      const response = await request(app)
        .delete(`/foods/${food.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      const deleted = await prisma.food.findUnique({
        where: {
          id: food.id,
        },
      });

      expect(deleted).toBeNull();
    });

    it("should reject deleting another user's food", async () => {
      const food = await createFood(secondUserId);

      const response = await request(app)
        .delete(`/foods/${food.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /foods/:id/favourite", () => {
    it("should favourite a food", async () => {
      const food = await createFood();

      const response = await request(app)
        .post(`/foods/${food.id}/favourite`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(201);

      const favourite = await prisma.userFoodFavourite.findUnique({
        where: {
          userId_foodId: {
            userId,
            foodId: food.id,
          },
        },
      });

      expect(favourite).not.toBeNull();
    });

    it("should reject duplicate favourite", async () => {
      const food = await createFood();

      await prisma.userFoodFavourite.create({
        data: {
          userId,
          foodId: food.id,
        },
      });

      const response = await request(app)
        .post(`/foods/${food.id}/favourite`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /foods/:id/favourite", () => {
    it("should remove favourite", async () => {
      const food = await createFood();

      await prisma.userFoodFavourite.create({
        data: {
          userId,
          foodId: food.id,
        },
      });

      const response = await request(app)
        .delete(`/foods/${food.id}/favourite`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it("should reject removing non-existent favourite", async () => {
      const food = await createFood();

      const response = await request(app)
        .delete(`/foods/${food.id}/favourite`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /foods/favourites", () => {
    it("should return favourite foods", async () => {
      const food = await createFood();

      await prisma.userFoodFavourite.create({
        data: {
          userId,
          foodId: food.id,
        },
      });

      const response = await request(app)
        .get("/foods/favourites")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].food.id).toBe(food.id);
    });

    it("should return empty array when user has no favourites", async () => {
      const response = await request(app)
        .get("/foods/favourites")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("Authentication", () => {
    it("should reject requests without a token", async () => {
      const response = await request(app).get("/foods");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authorization header missing");
    });

    it("should reject invalid token", async () => {
      const response = await request(app)
        .get("/foods")
        .set("Authorization", "Bearer invalidtoken");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired token");
    });
  });
});
