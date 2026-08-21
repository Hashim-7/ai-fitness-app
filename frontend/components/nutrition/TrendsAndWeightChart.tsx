"use client";

import React, { useState } from "react";
import type { DaySummary, WeightLog } from "../../lib/nutrition/types";
import { formatShortDate, formatWholeNumber } from "../../lib/nutrition/utils";

type TrendsAndWeightChartProps = {
  recentDays: DaySummary[];
  weightLogs?: WeightLog[];
  dailyCalorieGoal?: number | null;
};

export function TrendsAndWeightChart({
  recentDays,
  weightLogs = [],
  dailyCalorieGoal,
}: TrendsAndWeightChartProps) {
  const [range, setRange] = useState<7 | 14 | 30>(7);

  const daysSlice = recentDays.slice(0, range).reverse();
  const maxCalories = Math.max(
    dailyCalorieGoal ? dailyCalorieGoal * 1.2 : 2500,
    ...daysSlice.map((d) => d.totals.calories),
    1000,
  );

  // Find corresponding weight for days if present
  const weightMap = new Map<string, number>();
  weightLogs.forEach((wl) => {
    const dStr = wl.date.split("T")[0];
    weightMap.set(dStr, wl.weightKg);
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header & Range Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Calorie & Weight Trends
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Historical calorie consumption alongside weight tracking
          </p>
        </div>

        <div className="flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                range === r
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {daysSlice.length === 0 ? (
        <div className="my-8 flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">No recent logging history to display</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Visual Bar Chart */}
          <div className="relative flex h-48 items-end gap-2 border-b border-zinc-100 pb-2 pt-6 dark:border-zinc-800">
            {/* Goal Line Indicator */}
            {dailyCalorieGoal && (
              <div
                className="absolute left-0 right-0 z-0 border-b border-dashed border-indigo-400/60"
                style={{
                  bottom: `${(dailyCalorieGoal / maxCalories) * 100}%`,
                }}
              >
                <span className="absolute -top-3 right-0 rounded bg-indigo-50 px-1 py-0.5 text-[9px] font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  Target: {dailyCalorieGoal} kcal
                </span>
              </div>
            )}

            {daysSlice.map((day) => {
              const heightPct = Math.min((day.totals.calories / maxCalories) * 100, 100);
              const isGoalMet =
                dailyCalorieGoal && Math.abs(day.totals.calories - dailyCalorieGoal) <= dailyCalorieGoal * 0.1;
              const weightVal = weightMap.get(day.date);

              return (
                <div
                  key={day.date}
                  className="group relative flex flex-1 flex-col items-center h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 z-20 hidden rounded-lg bg-zinc-900 px-2 py-1 text-center text-[10px] text-white shadow-md group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                    <p className="font-bold">{formatShortDate(day.date)}</p>
                    <p>{formatWholeNumber(day.totals.calories)} kcal</p>
                    {weightVal && <p className="text-emerald-400 dark:text-emerald-600">{weightVal} kg</p>}
                  </div>

                  {/* Weight Dot Tag if logged */}
                  {weightVal && (
                    <span className="mb-1 rounded-full bg-emerald-500 px-1 py-0.5 text-[9px] font-bold text-white shadow-sm">
                      {weightVal}kg
                    </span>
                  )}

                  {/* Calorie Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isGoalMet
                        ? "bg-gradient-to-t from-indigo-600 to-indigo-400"
                        : day.totals.calories > (dailyCalorieGoal || 2000)
                        ? "bg-gradient-to-t from-amber-500 to-orange-400"
                        : "bg-gradient-to-t from-zinc-400 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Date label */}
                  <span className="mt-2 text-[10px] text-zinc-400 truncate w-full text-center">
                    {formatShortDate(day.date).split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-indigo-500" />
                <span>On Target</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-500" />
                <span>Above Target</span>
              </div>
              {weightLogs.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Weight Logged</span>
                </div>
              )}
            </div>

            <span>
              Average:{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {formatWholeNumber(
                  daysSlice.reduce((acc, d) => acc + d.totals.calories, 0) / (daysSlice.length || 1),
                )}{" "}
                kcal/day
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
