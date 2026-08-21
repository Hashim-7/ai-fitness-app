export type Goal = {
  id: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
};

export type Food = {
  id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdByUserId?: string | null;
};

export type DiaryItem = {
  id: string;
  mealType: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  food: Food;
};

export type DiaryResponse = {
  date: string;
  items: DiaryItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goal: Goal | null;
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
};

export type FoodFavourite = {
  id: string;
  userId: string;
  foodId: string;
  createdAt: string;
  food: Food;
};

export type FoodSearchResponse =
  | Food[]
  | {
      foods?: Food[];
      data?: Food[];
      items?: Food[];
    };

export type CreateFoodInput = {
  name: string;
  brand?: string;
  barcode?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type UpsertGoalInput = {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
};

export type DaySummary = {
  date: string;
  totals: DiaryResponse["totals"];
  itemCount: number;
};

export type QuantityMode = "servings" | "custom";

export type WeightLog = {
  id: string;
  weightKg: number;
  date: string;
  createdAt: string;
};

export type WeightLogsResponse = {
  data: WeightLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PendingCartItem = {
  food: Food;
  servings: number;
  quantityMode: QuantityMode;
  customAmount: number;
};

export type MealPreset = {
  id: string;
  name: string;
  mealType: string;
  items: {
    food: Food;
    servings: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

export type NutritionInsight = {
  type: "positive" | "warning" | "info";
  title: string;
  description: string;
};

export type StreakData = {
  currentStreak: number;
  bestStreak: number;
  lastLoggedDate: string | null;
};

