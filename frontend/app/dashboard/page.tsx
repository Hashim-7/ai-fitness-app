"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "../../lib/api";

type DiaryResponse = {
  date: string;
  items: unknown[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goal: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
  } | null;
};

function today() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

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
          err instanceof Error ? err.message : "Unable to load your dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-200" />
        </div>

        <div className="h-40 animate-pulse rounded-xl border border-zinc-200 bg-white" />

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
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
          <p className="font-medium text-red-900">Unable to load dashboard</p>

          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const foodCount = diary?.items.length ?? 0;
  const calories = diary?.totals.calories ?? 0;
  const calorieTarget = diary?.goal?.dailyCalories ?? null;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-zinc-500">{formatDate()}</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Here&apos;s a quick look at your day.
        </p>
      </div>

      {/* Today */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Today</p>

            <h2 className="mt-1 text-xl font-semibold text-zinc-950">
              {foodCount === 0
                ? "Nothing logged yet"
                : `${foodCount} ${
                    foodCount === 1 ? "food item" : "food items"
                  } logged`}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {calories === 0
                ? "Start tracking your meals to see your progress."
                : `${Math.round(calories)} kcal logged today.`}
            </p>
          </div>

          <Link
            href="/dashboard/nutrition"
            className="inline-flex w-fit items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            View nutrition
          </Link>
        </div>

        {calorieTarget !== null && (
          <div className="mt-6 border-t border-zinc-100 pt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700">
                Daily calorie target
              </span>

              <span className="text-zinc-500">
                {Math.round(calories)} / {Math.round(calorieTarget)} kcal
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all"
                style={{
                  width: `${Math.min((calories / calorieTarget) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-950">Quick actions</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Jump back into your fitness journey.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <QuickAction
            href="/dashboard/nutrition"
            title="Nutrition"
            description="Log food and track your daily nutrition."
          />

          <QuickAction
            href="/dashboard/workouts"
            title="Workouts"
            description="View and manage your workouts."
          />

          <QuickAction
            href="/dashboard/nutrition"
            title="Goals"
            description="Review and manage your nutrition goals."
          />
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-950">{title}</h3>

        <span className="text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-900">
          →
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </Link>
  );
}
