import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { authLimiter } from "../src/middleware/rateLimiter";

describe("Rate Limiter", () => {
  const app = express();

  app.use(express.json());

  app.post("/test", authLimiter, (_req, res) => {
    res.status(200).json({ success: true });
  });

  it("blocks after 10 requests", async () => {
    let response;

    for (let i = 0; i < 11; i++) {
      response = await request(app).post("/test");
    }

    expect(response!.status).toBe(429);
    expect(response!.body.message).toBe(
      "Too many attempts, please try again later",
    );
  });
});
