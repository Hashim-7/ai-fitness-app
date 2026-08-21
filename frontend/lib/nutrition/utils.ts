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

export function calculateStreak(loggedDates: string[]): { currentStreak: number; bestStreak: number; lastLoggedDate: string | null } {
  if (!loggedDates || loggedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastLoggedDate: null };
  }

  const uniqueSorted = Array.from(new Set(loggedDates)).sort((a, b) => b.localeCompare(a));
  const lastLoggedDate = uniqueSorted[0] || null;
  const t = today();
  const y = addDays(t, -1);

  let currentStreak = 0;
  let checkDate = uniqueSorted.includes(t) ? t : uniqueSorted.includes(y) ? y : null;

  if (checkDate) {
    while (uniqueSorted.includes(checkDate)) {
      currentStreak += 1;
      checkDate = addDays(checkDate, -1);
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  const ascending = Array.from(new Set(loggedDates)).sort((a, b) => a.localeCompare(b));

  for (let i = 0; i < ascending.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = ascending[i - 1];
      const currDate = ascending[i];
      if (addDays(prevDate, 1) === currDate) {
        tempStreak += 1;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  return { currentStreak, bestStreak, lastLoggedDate };
}

export function generateNutritionInsights(
  recentSummaries: { date: string; totals: { calories: number; protein: number; carbs: number; fat: number }; itemCount: number }[],
  goal: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number } | null,
): { type: "positive" | "warning" | "info"; title: string; description: string }[] {
  const insights: { type: "positive" | "warning" | "info"; title: string; description: string }[] = [];

  if (!recentSummaries || recentSummaries.length === 0) {
    return [
      {
        type: "info",
        title: "Start Logging Daily",
        description: "Log your food regularly to reveal personalized nutrition insights and trend observations.",
      },
    ];
  }

  const activeDays = recentSummaries.filter((d) => d.itemCount > 0);
  const totalDays = activeDays.length;

  if (totalDays === 0) return insights;

  const avgCalories = Math.round(activeDays.reduce((acc, d) => acc + d.totals.calories, 0) / totalDays);
  const avgProtein = Math.round(activeDays.reduce((acc, d) => acc + d.totals.protein, 0) / totalDays);

  if (goal) {
    const proteinTargetMetDays = activeDays.filter((d) => d.totals.protein >= goal.dailyProtein * 0.9).length;
    const calorieTargetMetDays = activeDays.filter(
      (d) => Math.abs(d.totals.calories - goal.dailyCalories) <= goal.dailyCalories * 0.15,
    ).length;

    if (proteinTargetMetDays >= Math.ceil(totalDays / 2)) {
      insights.push({
        type: "positive",
        title: "Great Protein Consistency!",
        description: `You hit your protein goal on ${proteinTargetMetDays} of the last ${totalDays} logged days. Average: ${avgProtein}g.`,
      });
    } else {
      insights.push({
        type: "warning",
        title: "Protein Below Target",
        description: `Protein was below target on ${totalDays - proteinTargetMetDays} of the last ${totalDays} logged days. Average: ${avgProtein}g / target ${goal.dailyProtein}g.`,
      });
    }

    if (calorieTargetMetDays >= Math.ceil(totalDays / 2)) {
      insights.push({
        type: "positive",
        title: "Balanced Calorie Intake",
        description: `Your daily calories were within target range on ${calorieTargetMetDays} of the last ${totalDays} logged days.`,
      });
    }
  }

  insights.push({
    type: "info",
    title: "Weekly Intake Average",
    description: `Across ${totalDays} logged day${totalDays === 1 ? "" : "s"}, you averaged ${avgCalories} kcal and ${avgProtein}g protein per day.`,
  });

  return insights;
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("recent_food_searches");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const searches = getRecentSearches();
    const updated = [query.trim(), ...searches.filter((s) => s.toLowerCase() !== query.trim().toLowerCase())].slice(0, 5);
    localStorage.setItem("recent_food_searches", JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function getDailyNote(date: string): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(`daily_note_${date}`) || "";
  } catch {
    return "";
  }
}

export function saveDailyNote(date: string, note: string) {
  if (typeof window === "undefined") return;
  try {
    if (note.trim()) {
      localStorage.setItem(`daily_note_${date}`, note.trim());
    } else {
      localStorage.removeItem(`daily_note_${date}`);
    }
  } catch {
    // Ignore storage errors
  }
}

