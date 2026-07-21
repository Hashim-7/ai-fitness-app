import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import app from "../src/app";

vi.mock("@aws-sdk/s3-request-presigner");

describe("POST /uploads/presign", () => {
  it("should return a presigned upload URL", async () => {
    const response = await request(app).post("/uploads/presign").send({
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

  it("should reject missing filename", async () => {
    const response = await request(app).post("/uploads/presign").send({
      contentType: "image/png",
    });

    expect(response.statusCode).toBe(400);
  });

  it("should reject missing content type", async () => {
    const response = await request(app).post("/uploads/presign").send({
      filename: "test.png",
    });

    expect(response.statusCode).toBe(400);
  });
});
