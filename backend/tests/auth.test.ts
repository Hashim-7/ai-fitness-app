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

describe("Auth Routes", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "Password123",
      });

      expect(response.status).toBe(201);

      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.username).toBe("testuser");

      expect(response.body).toHaveProperty("token");
    });

    it("should reject duplicate email registration", async () => {
      await request(app).post("/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "Password123",
      });

      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        username: "anotheruser",
        password: "Password123",
      });

      expect(response.status).toBe(400);

      expect(response.body.message).toBe("Email already in use");
    });

    it("should reject missing email or password", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);

      expect(response.body.message).toBe("Email and password are required");
    });

    it("should reject invalid email format", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "not-an-email",
        username: "testuser",
        password: "Password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid email format");
    });

    it("should reject password with no uppercase", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Password must be at least 8 characters and contain uppercase, lowercase, and a number",
      );
    });

    it("should reject password with no lowercase", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "PASSWORD123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Password must be at least 8 characters and contain uppercase, lowercase, and a number",
      );
    });

    it("should reject password with no number", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "Password",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Password must be at least 8 characters and contain uppercase, lowercase, and a number",
      );
    });

    it("should reject password shorter than 8 characters", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "Pass123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Password must be at least 8 characters and contain uppercase, lowercase, and a number",
      );
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "Password123",
      });
    });

    it("should login an existing user", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "Password123",
      });

      expect(response.status).toBe(200);

      expect(response.body.user.email).toBe("test@example.com");

      expect(response.body).toHaveProperty("token");
    });

    it("should reject invalid password", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);

      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should reject unknown email", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "unknown@example.com",
        password: "Password123",
      });

      expect(response.status).toBe(401);

      expect(response.body.message).toBe("Invalid email or password");
    });
  });
});
