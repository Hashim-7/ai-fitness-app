import { PrismaClient, MealType } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting seed...");

  // =====================
  // CLEAN DATABASE
  // =====================

  await prisma.diaryItem.deleteMany();
  await prisma.diaryEntry.deleteMany();
  await prisma.userFoodFavourite.deleteMany();
  await prisma.food.deleteMany();
  await prisma.weightLog.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  // =====================
  // CREATE USER
  // =====================

  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.create({
    data: {
      email: "test@fitness.com",
      username: "testuser",
      password: passwordHash,
    },
  });

  console.log("Created user:", user.email);

  // =====================
  // CREATE GOAL
  // =====================

  await prisma.goal.create({
    data: {
      userId: user.id,

      dailyCalories: 2200,

      dailyProtein: 160,
      dailyCarbs: 250,
      dailyFat: 70,
    },
  });

  // =====================
  // WEIGHT LOGS
  // =====================

  await prisma.weightLog.createMany({
    data: [
      {
        userId: user.id,
        weightKg: 85,
        date: new Date("2026-01-01"),
      },
      {
        userId: user.id,
        weightKg: 83.8,
        date: new Date("2026-02-01"),
      },
      {
        userId: user.id,
        weightKg: 82.5,
        date: new Date("2026-03-01"),
      },
    ],
  });

  // =====================
  // GLOBAL FOOD DATABASE
  // =====================

  const chicken = await prisma.food.create({
    data: {
      name: "Chicken Breast",
      brand: "Generic",

      barcode: "100000001",

      servingSize: 100,
      servingUnit: "g",

      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3,
    },
  });

  const rice = await prisma.food.create({
    data: {
      name: "White Rice",
      brand: "Generic",

      barcode: "100000002",

      servingSize: 100,
      servingUnit: "g",

      calories: 130,
      protein: 3,
      carbs: 28,
      fat: 0,
    },
  });

  const banana = await prisma.food.create({
    data: {
      name: "Banana",

      barcode: "100000003",

      servingSize: 1,
      servingUnit: "piece",

      calories: 105,
      protein: 1,
      carbs: 27,
      fat: 0,
    },
  });

  // =====================
  // CUSTOM USER FOOD
  // =====================

  const proteinShake = await prisma.food.create({
    data: {
      name: "My Protein Shake",

      servingSize: 1,
      servingUnit: "shake",

      calories: 250,
      protein: 35,
      carbs: 10,
      fat: 5,

      createdByUserId: user.id,
    },
  });

  // =====================
  // FAVOURITES
  // =====================

  await prisma.userFoodFavourite.createMany({
    data: [
      {
        userId: user.id,
        foodId: chicken.id,
      },
      {
        userId: user.id,
        foodId: proteinShake.id,
      },
    ],
  });

  // =====================
  // TODAY DIARY
  // =====================

  const diary = await prisma.diaryEntry.create({
    data: {
      userId: user.id,
      date: new Date(),
    },
  });

  // =====================
  // LOG FOOD
  // =====================

  await prisma.diaryItem.createMany({
    data: [
      {
        diaryEntryId: diary.id,
        foodId: chicken.id,

        mealType: MealType.LUNCH,

        servings: 2,

        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 6,
      },

      {
        diaryEntryId: diary.id,
        foodId: rice.id,

        mealType: MealType.LUNCH,

        servings: 2,

        calories: 260,
        protein: 6,
        carbs: 56,
        fat: 0,
      },

      {
        diaryEntryId: diary.id,
        foodId: banana.id,

        mealType: MealType.SNACK,

        servings: 1,

        calories: 105,
        protein: 1,
        carbs: 27,
        fat: 0,
      },

      {
        diaryEntryId: diary.id,
        foodId: proteinShake.id,

        mealType: MealType.SNACK,

        servings: 1,

        calories: 250,
        protein: 35,
        carbs: 10,
        fat: 5,
      },
    ],
  });

  console.log("✅ Seed completed");

  console.log(`
Login:
email: test@fitness.com
password: password123
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
