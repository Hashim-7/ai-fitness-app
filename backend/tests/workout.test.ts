import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

describe("Workout Routes", () => {
  let token: string;
  let secondToken: string;
  let userId: string;
  let secondUserId: string;

  beforeEach(async () => {
    await prisma.workoutItem.deleteMany();
    await prisma.workoutEntry.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.user.deleteMany();

    const user = await request(app).post("/auth/register").send({
      email: "testworkout@example.com",
      username: "workoutuser",
      password: "Password123",
    });
    token = user.body.token;

    userId = (await prisma.user.findUnique({
      where: { email: "testworkout@example.com" },
    }))!.id;

    const secondUser = await request(app).post("/auth/register").send({
      email: "otherworkout@example.com",
      username: "otherworkoutuser",
      password: "Password123",
    });
    secondToken = secondUser.body.token;

    secondUserId = (await prisma.user.findUnique({
      where: { email: "otherworkout@example.com" },
    }))!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createExercise() {
    return prisma.exercise.create({
      data: {
        name: "Barbell Bench Press",
        category: "STRENGTH",
        muscleGroup: "CHEST",
        equipment: "Barbell",
      },
    });
  }

  describe("Exercises API", () => {
    it("should fetch exercises list", async () => {
      await createExercise();

      const response = await request(app)
        .get("/exercises")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].name).toBe("Barbell Bench Press");
    });

    it("should create a custom exercise", async () => {
      const response = await request(app)
        .post("/exercises")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Incline Dumbbell Press",
          category: "STRENGTH",
          muscleGroup: "CHEST",
          equipment: "Dumbbells",
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Incline Dumbbell Press");
      expect(response.body.createdByUserId).toBe(userId);
    });

    it("should reject exercise creation with empty name", async () => {
      const response = await request(app)
        .post("/exercises")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Workouts API", () => {
    it("should return empty workout session for a date", async () => {
      const response = await request(app)
        .get("/workouts?date=2026-08-20")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.exercises).toEqual([]);
      expect(response.body.totals.totalExercises).toBe(0);
    });

    it("should log an exercise into workout session", async () => {
      const exercise = await createExercise();

      const response = await request(app)
        .post("/workouts/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-08-20",
          exerciseId: exercise.id,
          sets: 4,
          reps: 10,
          weightKg: 80,
          notes: "Felt strong on set 3",
        });

      expect(response.status).toBe(201);
      expect(response.body.sets).toBe(4);
      expect(response.body.reps).toBe(10);
      expect(response.body.weightKg).toBe(80);
      expect(response.body.exercise.name).toBe("Barbell Bench Press");
    });

    it("should update a logged workout item", async () => {
      const exercise = await createExercise();

      const itemRes = await request(app)
        .post("/workouts/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-08-20",
          exerciseId: exercise.id,
          sets: 3,
          reps: 8,
          weightKg: 70,
        });

      const itemId = itemRes.body.id;

      const updateRes = await request(app)
        .patch(`/workouts/items/${itemId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          sets: 4,
          reps: 12,
          weightKg: 75,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.sets).toBe(4);
      expect(updateRes.body.reps).toBe(12);
      expect(updateRes.body.weightKg).toBe(75);
    });

    it("should prevent unauthorized user from updating another user's workout item", async () => {
      const exercise = await createExercise();

      const itemRes = await request(app)
        .post("/workouts/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-08-20",
          exerciseId: exercise.id,
          sets: 3,
          reps: 8,
        });

      const itemId = itemRes.body.id;

      const updateRes = await request(app)
        .patch(`/workouts/items/${itemId}`)
        .set("Authorization", `Bearer ${secondToken}`)
        .send({
          sets: 5,
        });

      expect(updateRes.status).toBe(403);
    });

    it("should delete a workout item", async () => {
      const exercise = await createExercise();

      const itemRes = await request(app)
        .post("/workouts/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-08-20",
          exerciseId: exercise.id,
          sets: 3,
          reps: 8,
        });

      const itemId = itemRes.body.id;

      const deleteRes = await request(app)
        .delete(`/workouts/items/${itemId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get("/workouts?date=2026-08-20")
        .set("Authorization", `Bearer ${token}`);

      expect(getRes.body.exercises).toEqual([]);
    });

    it("should reject logging with invalid date format", async () => {
      const exercise = await createExercise();

      const response = await request(app)
        .post("/workouts/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "invalid-date",
          exerciseId: exercise.id,
          sets: 3,
        });

      expect(response.status).toBe(400);
    });
  });
});
