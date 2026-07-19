import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

describe("User Routes", () => {
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

  describe("GET /users/me", () => {
    it("should return the authenticated user's profile", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.email).toBe("test@example.com");
      expect(response.body.username).toBe("testuser");

      expect(response.body).not.toHaveProperty("password");
    });

    it("should reject requests without a token", async () => {
      const response = await request(app).get("/users/me");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authorization header missing");
    });

    it("should reject an invalid token", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", "Bearer invalidtoken");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired token");
    });
  });

  describe("PATCH /users/me", () => {
    it("should update the user's email", async () => {
      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "new@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe("new@example.com");
      expect(response.body.username).toBe("testuser");
    });

    it("should update the user's username", async () => {
      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          username: "newusername",
        });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe("newusername");
    });

    it("should update both email and username", async () => {
      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "new@example.com",
          username: "newusername",
        });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe("new@example.com");
      expect(response.body.username).toBe("newusername");
    });

    it("should reject an invalid email format", async () => {
      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid email format");
    });

    it("should reject a duplicate email", async () => {
      await request(app).post("/auth/register").send({
        email: "another@example.com",
        username: "anotheruser",
        password: "Password123",
      });

      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "another@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email already in use");
    });

    it("should reject a duplicate username", async () => {
      await request(app).post("/auth/register").send({
        email: "another@example.com",
        username: "anotheruser",
        password: "Password123",
      });

      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          username: "anotheruser",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username already in use");
    });

    it("should reject requests without a token", async () => {
      const response = await request(app).patch("/users/me").send({
        username: "newusername",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authorization header missing");
    });
  });

  describe("DELETE /users/me", () => {
    it("should delete the authenticated user's account", async () => {
      const response = await request(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Account deleted successfully");

      const user = await prisma.user.findUnique({
        where: {
          email: "test@example.com",
        },
      });

      expect(user).toBeNull();
    });

    it("should reject requests without a token", async () => {
      const response = await request(app).delete("/users/me");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authorization header missing");
    });

    it("should reject an invalid token", async () => {
      const response = await request(app)
        .delete("/users/me")
        .set("Authorization", "Bearer invalidtoken");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired token");
    });
  });
});
