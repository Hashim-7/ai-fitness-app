"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "../../lib/api";

type Goal = {
  id: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
};

type Food = {
  id: string;
  name: string;
};

type DiaryItem = {
  id: string;
  mealType: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  food: Food;
};

type DiaryResponse = {
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

type Stat = {
  label: string;
  value: number;
  target: number | null;
  unit: string;
};

function today() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(value);
}

function mealLabel(mealType: string) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase();
}

const mealOrder = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export default function DashboardPage() {
  const [diary, setDiary] = useState<DiaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        if (!getToken()) {
          setError("You are not logged in.");
          return;
        }

        const result = await apiFetch<DiaryResponse>(
          `/diaries?date=${today()}`,
        );

        setDiary(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const stats = useMemo<Stat[]>(() => {
    const totals = diary?.totals;

    return [
      {
        label: "Calories",
        value: totals?.calories ?? 0,
        target: diary?.goal?.dailyCalories ?? null,
        unit: "kcal",
      },
      {
        label: "Protein",
        value: totals?.protein ?? 0,
        target: diary?.goal?.dailyProtein ?? null,
        unit: "g",
      },
      {
        label: "Carbs",
        value: totals?.carbs ?? 0,
        target: diary?.goal?.dailyCarbs ?? null,
        unit: "g",
      },
      {
        label: "Fat",
        value: totals?.fat ?? 0,
        target: diary?.goal?.dailyFat ?? null,
        unit: "g",
      },
    ];
  }, [diary]);

  const meals = useMemo(() => {
    const items = diary?.items ?? [];

    return mealOrder.map((type) => ({
      type,
      items: items.filter(
        (item) => item.mealType.toUpperCase() === type,
      ),
    }));
  }, [diary]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border border-zinc-200 bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Dashboard
        </h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-900">
            Unable to load dashboard
          </p>

          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Keep track of your nutrition and daily progress.
          </p>
        </div>

        <Link
          href="/dashboard/nutrition"
          className="inline-flex w-fit items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          + Log food
        </Link>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const percentage =
            stat.target && stat.target > 0
              ? Math.min((stat.value / stat.target) * 100, 100)
              : 0;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-200 bg-white p-5"
            >
              <p className="text-sm font-medium text-zinc-500">
                {stat.label}
              </p>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {formatNumber(stat.value)}
                </span>

                <span className="text-sm text-zinc-500">
                  {stat.unit}
                </span>
              </div>

              <p className="mt-2 text-xs text-zinc-400">
                {stat.target !== null
                  ? `Target: ${formatNumber(stat.target)} ${stat.unit}`
                  : "No target set"}
              </p>

              {stat.target !== null && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Today&apos;s meals</h2>

          <p className="text-sm text-zinc-500">
            {diary?.items.length
              ? `${diary.items.length} food ${
                  diary.items.length === 1 ? "item" : "items"
                } logged today.`
              : "Your meals for today will appear here."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {meals.map((meal) => {
            const calories = meal.items.reduce(
              (total, item) => total + item.calories,
              0,
            );

            return (
              <div
                key={meal.type}
                className="rounded-xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold">
                    {mealLabel(meal.type)}
                  </h3>

                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                    {formatNumber(calories)} kcal
                  </span>
                </div>

                {meal.items.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500">
                    No food logged
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {meal.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-t border-zinc-100 pt-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.food.name}
                          </p>

                          <p className="mt-0.5 text-xs text-zinc-500">
                            {item.servings}{" "}
                            {item.servings === 1
                              ? "serving"
                              : "servings"}
                            {" · "}
                            {formatNumber(item.protein)}g protein
                          </p>
                        </div>

                        <span className="ml-4 shrink-0 text-sm font-medium text-zinc-600">
                          {formatNumber(item.calories)} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {!diary?.goal && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-950">
            Set your nutrition goals
          </h3>

          <p className="mt-1 text-sm text-amber-800">
            You haven&apos;t set daily calorie and macro targets yet.
          </p>

          <Link
            href="/dashboard/nutrition"
            className="mt-3 inline-block text-sm font-semibold text-amber-950 underline"
          >
            Set your goals
          </Link>
        </div>
      )}
    </div>
  );
}
