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

describe("Weight Log Routes", () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    await prisma.weightLog.deleteMany();
    await prisma.user.deleteMany();

    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      username: "testuser",
      password: "Password123",
    });

    token = response.body.token;

    userId = (await prisma.user.findUnique({
      where: {
        email: "test@example.com",
      },
    }))!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /weight-logs", () => {
    it("should create a weight log", async () => {
      const response = await request(app)
        .post("/weight-logs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          weightKg: 82.5,
        });

      expect(response.status).toBe(201);
      expect(response.body.weightKg).toBe(82.5);

      const logs = await prisma.weightLog.findMany();

      expect(logs.length).toBe(1);
    });

    it("should reject an invalid weight", async () => {
      const response = await request(app)
        .post("/weight-logs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          weightKg: -5,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Weight must be greater than zero");
    });

    it("should reject a future date", async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);

      const response = await request(app)
        .post("/weight-logs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          weightKg: 80,
          date: future,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Weight log date cannot be in the future",
      );
    });

    it("should reject requests without a token", async () => {
      const response = await request(app).post("/weight-logs").send({
        weightKg: 80,
      });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /weight-logs", () => {
    it("should return all weight logs", async () => {
      await prisma.weightLog.createMany({
        data: [
          {
            userId,
            weightKg: 80,
          },
          {
            userId,
            weightKg: 79,
          },
        ],
      });

      const response = await request(app)
        .get("/weight-logs")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });
  });

  describe("GET /weight-logs/:id", () => {
    it("should return a single weight log", async () => {
      const log = await prisma.weightLog.create({
        data: {
          userId,
          weightKg: 80,
        },
      });

      const response = await request(app)
        .get(`/weight-logs/${log.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(log.id);
    });

    it("should return 404 if log does not exist", async () => {
      const response = await request(app)
        .get("/weight-logs/not-a-real-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /weight-logs/:id", () => {
    it("should update a weight log", async () => {
      const log = await prisma.weightLog.create({
        data: {
          userId,
          weightKg: 80,
        },
      });

      const response = await request(app)
        .patch(`/weight-logs/${log.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          weightKg: 78.5,
        });

      expect(response.status).toBe(200);
      expect(response.body.weightKg).toBe(78.5);
    });

    it("should reject invalid weight", async () => {
      const log = await prisma.weightLog.create({
        data: {
          userId,
          weightKg: 80,
        },
      });

      const response = await request(app)
        .patch(`/weight-logs/${log.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          weightKg: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Weight must be greater than zero");
    });
  });

  describe("DELETE /weight-logs/:id", () => {
    it("should delete a weight log", async () => {
      const log = await prisma.weightLog.create({
        data: {
          userId,
          weightKg: 80,
        },
      });

      const response = await request(app)
        .delete(`/weight-logs/${log.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Weight log deleted successfully");

      const deleted = await prisma.weightLog.findUnique({
        where: {
          id: log.id,
        },
      });

      expect(deleted).toBeNull();
    });

    it("should return 404 if log does not exist", async () => {
      const response = await request(app)
        .delete("/weight-logs/not-real")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /weight-logs/latest", () => {
    it("should return the latest weight log", async () => {
      await prisma.weightLog.create({
        data: {
          userId,
          weightKg: 80,
          date: new Date("2024-01-01"),
        },
      });

      await prisma.weightLog.create({
        data: {
          userId,
          weightKg: 78,
          date: new Date("2024-02-01"),
        },
      });

      const response = await request(app)
        .get("/weight-logs/latest")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.weightKg).toBe(78);
    });

    it("should return 404 if there are no logs", async () => {
      const response = await request(app)
        .get("/weight-logs/latest")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /weight-logs/trend", () => {
    it("should calculate weight trend", async () => {
      await prisma.weightLog.create({
        data: {
          userId,
          weightKg: 82,
          date: new Date("2024-01-01"),
        },
      });

      await prisma.weightLog.create({
        data: {
          userId,
          weightKg: 79,
          date: new Date("2024-02-01"),
        },
      });

      const response = await request(app)
        .get("/weight-logs/trend")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.startWeight).toBe(82);
      expect(response.body.currentWeight).toBe(79);
      expect(response.body.difference).toBe(-3);
    });

    it("should reject if fewer than two logs exist", async () => {
      await prisma.weightLog.create({
        data: {
          userId,
          weightKg: 80,
        },
      });

      const response = await request(app)
        .get("/weight-logs/trend")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Not enough weight logs to calculate trend",
      );
    });
  });

  it("should not allow another user to access a weight log", async () => {
    const firstUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    const log = await prisma.weightLog.create({
      data: {
        userId: firstUser!.id,
        weightKg: 80,
      },
    });

    const register = await request(app).post("/auth/register").send({
      email: "user2@example.com",
      username: "user2",
      password: "Password123",
    });

    const token2 = register.body.token;

    const response = await request(app)
      .get(`/weight-logs/${log.id}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Unauthorized access to weight log");
  });
});
