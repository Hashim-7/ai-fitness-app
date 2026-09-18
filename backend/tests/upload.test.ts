import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import app from "../src/app";

vi.mock("@aws-sdk/s3-request-presigner");

describe("POST /uploads/presign", () => {
  const token = jwt.sign(
    { userId: "test-user-id" },
    process.env.JWT_SECRET || "test_secret",
  );

  it("should return a presigned upload URL for authenticated user with valid image", async () => {
    const response = await request(app)
      .post("/uploads/presign")
      .set("Authorization", `Bearer ${token}`)
      .send({
        filename: "test.png",
        contentType: "image/png",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("uploadUrl");
    expect(response.body.uploadUrl).toBe(
      "https://fake-s3-upload-url.com/test-file",
    );
    expect(response.body).toHaveProperty("key");
  });

  it("should reject unauthenticated requests", async () => {
    const response = await request(app).post("/uploads/presign").send({
      filename: "test.png",
      contentType: "image/png",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should reject missing filename", async () => {
    const response = await request(app)
      .post("/uploads/presign")
      .set("Authorization", `Bearer ${token}`)
      .send({
        contentType: "image/png",
      });

    expect(response.statusCode).toBe(400);
  });

  it("should reject missing content type", async () => {
    const response = await request(app)
      .post("/uploads/presign")
      .set("Authorization", `Bearer ${token}`)
      .send({
        filename: "test.png",
      });

    expect(response.statusCode).toBe(400);
  });

  it("should reject disallowed file types (e.g. html/executable)", async () => {
    const response = await request(app)
      .post("/uploads/presign")
      .set("Authorization", `Bearer ${token}`)
      .send({
        filename: "malicious.sh",
        contentType: "application/x-sh",
      });

    expect(response.statusCode).toBe(400);
  });
});
