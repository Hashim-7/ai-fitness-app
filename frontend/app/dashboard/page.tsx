"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "../../lib/api";
import type { DiaryResponse, DaySummary } from "../../lib/nutrition/types";
import { calculateStreak, today, addDays } from "../../lib/nutrition/utils";
import { PhotoLogModal } from "../../components/nutrition/PhotoLogModal";

function formatDate() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export default function DashboardPage() {
  const [diary, setDiary] = useState<DiaryResponse | null>(null);
  const [recentDays, setRecentDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        if (!getToken()) {
          setError("You are not logged in.");
          return;
        }

        const result = await apiFetch<DiaryResponse>(`/diaries?date=${today()}`);
        setDiary(result);

        // Fetch recent days for streak & weekly average calculations
        const last7Dates = Array.from({ length: 7 }).map((_, i) => addDays(today(), -i));
        const summaries = await Promise.all(
          last7Dates.map(async (date) => {
            const d = await apiFetch<DiaryResponse>(`/diaries?date=${date}`);
            return {
              date,
              totals: d.totals,
              itemCount: d.items.length,
            } satisfies DaySummary;
          }),
        );

        setRecentDays(summaries.filter((s) => s.itemCount > 0));
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

  const streak = useMemo(() => {
    return calculateStreak(recentDays.map((d) => d.date));
  }, [recentDays]);

  const weeklyAvgCalories = useMemo(() => {
    if (recentDays.length === 0) return 0;
    return Math.round(recentDays.reduce((acc, d) => acc + d.totals.calories, 0) / recentDays.length);
  }, [recentDays]);

  const weeklyAvgProtein = useMemo(() => {
    if (recentDays.length === 0) return 0;
    return Math.round(recentDays.reduce((acc, d) => acc + d.totals.protein, 0) / recentDays.length);
  }, [recentDays]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="font-semibold text-red-900 dark:text-red-200">Unable to load dashboard</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const foodCount = diary?.items.length ?? 0;
  const calories = diary?.totals.calories ?? 0;
  const calorieTarget = diary?.goal?.dailyCalories ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400">{formatDate()}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100 md:text-3xl">
            Welcome Back!
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Overview of your nutrition progress, streak, and quick logging actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPhotoModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-95"
        >
          ✨ AI Photo Log
        </button>
      </div>

      {/* Widgets Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Streak Widget */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl text-orange-500 dark:bg-orange-950/40">
            🔥
          </div>
          <div>
            <span className="text-xs text-zinc-400">Logging Streak</span>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {streak.currentStreak} {streak.currentStreak === 1 ? "Day" : "Days"}
            </p>
          </div>
        </div>

        {/* Weekly Avg Calories */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-500 dark:bg-indigo-950/40">
            ⚡
          </div>
          <div>
            <span className="text-xs text-zinc-400">Weekly Avg Calories</span>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {weeklyAvgCalories} <span className="text-xs font-normal text-zinc-400">kcal</span>
            </p>
          </div>
        </div>

        {/* Weekly Avg Protein */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl text-emerald-500 dark:bg-emerald-950/40">
            💪
          </div>
          <div>
            <span className="text-xs text-zinc-400">Weekly Avg Protein</span>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {weeklyAvgProtein} <span className="text-xs font-normal text-zinc-400">g</span>
            </p>
          </div>
        </div>

        {/* Active Day Count */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-2xl text-purple-500 dark:bg-purple-950/40">
            📅
          </div>
          <div>
            <span className="text-xs text-zinc-400">Active Logging</span>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {recentDays.length} / 7 <span className="text-xs font-normal text-zinc-400">days</span>
            </p>
          </div>
        </div>
      </div>

      {/* Today Section */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Today Summary
            </span>
            <h2 className="mt-1 text-xl font-bold text-zinc-950 dark:text-zinc-100">
              {foodCount === 0
                ? "Nothing logged yet"
                : `${foodCount} ${foodCount === 1 ? "food item" : "food items"} logged`}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {calories === 0
                ? "Start tracking your meals or take a photo with AI."
                : `${Math.round(calories)} kcal logged today.`}
            </p>
          </div>

          <Link
            href="/dashboard/nutrition"
            className="inline-flex w-fit items-center rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Open Nutrition Diary →
          </Link>
        </div>

        {calorieTarget !== null && (
          <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Daily Calorie Target
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {Math.round(calories)} / {Math.round(calorieTarget)} kcal
              </span>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{
                  width: `${Math.min((calories / calorieTarget) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-100 mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickAction
            href="/dashboard/nutrition"
            title="Nutrition Tracker"
            description="Log meals, view macro charts, and analyze food photos with AI."
          />
          <QuickAction
            href="/dashboard/workouts"
            title="Workouts & Fitness"
            description="View exercise history and manage workout routines."
          />
          <QuickAction
            href="/dashboard/nutrition"
            title="Targets & Goals"
            description="Set and manage daily calorie, protein, carb, and fat targets."
          />
        </div>
      </section>

      {showPhotoModal && (
        <PhotoLogModal
          selectedMeal="BREAKFAST"
          selectedDate={today()}
          onMealChange={() => {}}
          onCreateAndAddFood={async (input, serv, meal) => {
            const food = await apiFetch<DiaryResponse["items"][0]["food"]>("/foods", {
              method: "POST",
              body: JSON.stringify(input),
            });
            await apiFetch("/diaries/items", {
              method: "POST",
              body: JSON.stringify({
                date: today(),
                mealType: meal,
                foodId: food.id,
                servings: serv,
              }),
            });
          }}
          onClose={() => setShowPhotoModal(false)}
        />
      )}
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
      className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-zinc-950 dark:text-zinc-100">{title}</h3>
        <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          →
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
    </Link>
  );
}
