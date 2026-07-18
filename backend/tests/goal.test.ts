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

describe("Goal Routes", () => {
  let token: string;

  beforeEach(async () => {
    await prisma.user.deleteMany();

    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      username: "testuser",
      password: "Password123",
    });

    token = response.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /goals/me", () => {
    it("should return the authenticated user's goal", async () => {
      await prisma.goal.create({
        data: {
          userId: (await prisma.user.findUnique({
            where: {
              email: "test@example.com",
            },
          }))!.id,

          dailyCalories: 2500,
          dailyProtein: 150,
          dailyCarbs: 275,
          dailyFat: 70,
        },
      });

      const response = await request(app)
        .get("/goals/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.dailyCalories).toBe(2500);
      expect(response.body.dailyProtein).toBe(150);
      expect(response.body.dailyCarbs).toBe(275);
      expect(response.body.dailyFat).toBe(70);
    });

    it("should reject if the user has no goal", async () => {
      const response = await request(app)
        .get("/goals/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Goal not found");
    });

    it("should reject requests without a token", async () => {
      const response = await request(app).get("/goals/me");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authorization header missing");
    });

    it("should reject an invalid token", async () => {
      const response = await request(app)
        .get("/goals/me")
        .set("Authorization", "Bearer invalidtoken");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired token");
    });
  });

  describe("PUT /goals/me", () => {
    it("should create a user's goal", async () => {
      const response = await request(app)
        .put("/goals/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dailyCalories: 2500,
          dailyProtein: 150,
          dailyCarbs: 275,
          dailyFat: 70,
        });

      expect(response.status).toBe(200);

      expect(response.body.dailyCalories).toBe(2500);
      expect(response.body.dailyProtein).toBe(150);
      expect(response.body.dailyCarbs).toBe(275);
      expect(response.body.dailyFat).toBe(70);
    });

    it("should update an existing goal", async () => {
      await request(app)
        .put("/goals/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dailyCalories: 2500,
          dailyProtein: 150,
          dailyCarbs: 275,
          dailyFat: 70,
        });

      const response = await request(app)
        .put("/goals/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dailyCalories: 3000,
          dailyProtein: 180,
          dailyCarbs: 330,
          dailyFat: 80,
        });

      expect(response.status).toBe(200);

      expect(response.body.dailyCalories).toBe(3000);
      expect(response.body.dailyProtein).toBe(180);
      expect(response.body.dailyCarbs).toBe(330);
      expect(response.body.dailyFat).toBe(80);

      const goals = await prisma.goal.findMany();

      expect(goals.length).toBe(1);
    });

    it("should reject macros that do not match calories", async () => {
      const response = await request(app)
        .put("/goals/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dailyCalories: 3000,
          dailyProtein: 10,
          dailyCarbs: 10,
          dailyFat: 10,
        });

      expect(response.status).toBe(400);

      expect(response.body.message).toBe(
        "Macros do not match daily calorie target",
      );
    });

    it("should reject negative goal values", async () => {
      const response = await request(app)
        .put("/goals/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dailyCalories: -2000,
          dailyProtein: 150,
          dailyCarbs: 275,
          dailyFat: 70,
        });

      expect(response.status).toBe(400);

      expect(response.body.message).toBe("Invalid goal values");
    });

    it("should reject requests without a token", async () => {
      const response = await request(app).put("/goals/me").send({
        dailyCalories: 2500,
        dailyProtein: 150,
        dailyCarbs: 275,
        dailyFat: 70,
      });

      expect(response.status).toBe(401);

      expect(response.body.message).toBe("Authorization header missing");
    });
  });

  describe("DELETE /goals/me", () => {
    it("should delete the authenticated user's goal", async () => {
      const user = await prisma.user.findUnique({
        where: {
          email: "test@example.com",
        },
      });

      await prisma.goal.create({
        data: {
          userId: user!.id,
          dailyCalories: 2500,
          dailyProtein: 150,
          dailyCarbs: 275,
          dailyFat: 70,
        },
      });

      const response = await request(app)
        .delete("/goals/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.message).toBe("Goal deleted successfully");

      const goal = await prisma.goal.findUnique({
        where: {
          userId: user!.id,
        },
      });

      expect(goal).toBeNull();
    });

    it("should reject deleting a goal that does not exist", async () => {
      const response = await request(app)
        .delete("/goals/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);

      expect(response.body.message).toBe("Goal not found");
    });

    it("should reject requests without a token", async () => {
      const response = await request(app).delete("/goals/me");

      expect(response.status).toBe(401);

      expect(response.body.message).toBe("Authorization header missing");
    });

    it("should reject an invalid token", async () => {
      const response = await request(app)
        .delete("/goals/me")
        .set("Authorization", "Bearer invalidtoken");

      expect(response.status).toBe(401);

      expect(response.body.message).toBe("Invalid or expired token");
    });
  });
});
