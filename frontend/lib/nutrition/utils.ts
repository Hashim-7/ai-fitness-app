import type { Food, FoodSearchResponse } from "./types";

export const mealOrder = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

export const servingUnits = ["g", "ml", "oz", "cup", "tbsp", "tsp", "piece"] as const;

export function formatDateISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function today() {
  return formatDateISO(new Date());
}

export function parseDateISO(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function addDays(value: string, delta: number) {
  const date = parseDateISO(value);

  date.setDate(date.getDate() + delta);

  return formatDateISO(date);
}

export function isToday(value: string) {
  return value === today();
}

export function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDateISO(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parseDateISO(value));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatWholeNumber(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function mealLabel(mealType: string) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase();
}

export function progress(value: number, target: number | null) {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.min((value / target) * 100, 100);
}

export function extractFoods(result: FoodSearchResponse): Food[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.foods)) {
    return result.foods;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.items)) {
    return result.items;
  }

  return [];
}

export function servingsFromCustomAmount(customAmount: number, food: Food) {
  if (food.servingSize <= 0) {
    return 1;
  }

  return customAmount / food.servingSize;
}

export function customAmountFromServings(servings: number, food: Food) {
  return servings * food.servingSize;
}

export function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const cells: Array<{ date: string | null; day: number | null }> = [];

  for (let index = 0; index < startPadding; index += 1) {
    cells.push({ date: null, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: formatDateISO(new Date(year, month, day)),
      day,
    });
  }

  return cells;
}
