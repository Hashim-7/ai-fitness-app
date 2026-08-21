"use client";

import React from "react";
import type { StreakData, NutritionInsight, Goal } from "../../lib/nutrition/types";

type NutritionInsightsProps = {
  streak: StreakData;
  insights: NutritionInsight[];
  goal?: Goal | null;
  todayTotals?: { calories: number; protein: number; carbs: number; fat: number };
};

export function NutritionInsights({ streak, insights, goal, todayTotals }: NutritionInsightsProps) {
  // Check goal achievement badges for today
  const hitCalories =
    goal && todayTotals ? Math.abs(todayTotals.calories - goal.dailyCalories) <= goal.dailyCalories * 0.1 : false;
  const hitProtein = goal && todayTotals ? todayTotals.protein >= goal.dailyProtein : false;
  const hitCarbs = goal && todayTotals ? todayTotals.carbs >= goal.dailyCarbs * 0.8 && todayTotals.carbs <= goal.dailyCarbs * 1.2 : false;

  return (
    <div className="space-y-4">
      {/* Streaks & Goal Badges Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Streak Widget */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl text-orange-500 dark:bg-orange-950/40 dark:text-orange-400">
            🔥
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Logging Streak</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {streak.currentStreak} {streak.currentStreak === 1 ? "Day" : "Days"}
              </span>
              {streak.bestStreak > streak.currentStreak && (
                <span className="text-[10px] text-zinc-400">Best: {streak.bestStreak}d</span>
              )}
            </div>
          </div>
        </div>

        {/* Calorie Achievement Badge */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              hitCalories
                ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            🎯
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Calorie Target</p>
            <span
              className={`text-sm font-bold ${
                hitCalories ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {hitCalories ? "Hit Today!" : goal ? "In Progress" : "No Target"}
            </span>
          </div>
        </div>

        {/* Protein Achievement Badge */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              hitProtein
                ? "bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            💪
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Protein Goal</p>
            <span
              className={`text-sm font-bold ${
                hitProtein ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {hitProtein ? "Target Reached!" : goal ? "In Progress" : "No Target"}
            </span>
          </div>
        </div>

        {/* Macro Balance Badge */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              hitCarbs
                ? "bg-teal-50 text-teal-500 dark:bg-teal-950/40 dark:text-teal-400"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            ⚖️
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Macro Balance</p>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {hitCarbs ? "Balanced Carbs" : "Active Tracking"}
            </span>
          </div>
        </div>
      </div>

      {/* AI / Frontend Generated Observations */}
      {insights.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Nutrition Observations
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Smart insights generated from your logging patterns
          </p>

          <div className="mt-4 space-y-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  insight.type === "positive"
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"
                    : insight.type === "warning"
                    ? "border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"
                    : "border-zinc-200 bg-zinc-50/50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-200"
                }`}
              >
                <span className="text-lg leading-none">
                  {insight.type === "positive" ? "✅" : insight.type === "warning" ? "⚠️" : "💡"}
                </span>
                <div>
                  <h4 className="text-xs font-bold">{insight.title}</h4>
                  <p className="mt-0.5 text-xs opacity-90">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
