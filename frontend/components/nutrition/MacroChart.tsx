"use client";

import React from "react";
import { formatWholeNumber } from "../../lib/nutrition/utils";

type MacroTotals = {
  protein: number;
  carbs: number;
  fat: number;
};

type MacroChartProps = {
  totals: MacroTotals;
  title?: string;
};

export function MacroDonutChart({ totals, title = "Macro Breakdown" }: MacroChartProps) {
  const proteinCal = totals.protein * 4;
  const carbsCal = totals.carbs * 4;
  const fatCal = totals.fat * 9;
  const totalCal = proteinCal + carbsCal + fatCal;

  const proteinPct = totalCal > 0 ? (proteinCal / totalCal) * 100 : 33.3;
  const carbsPct = totalCal > 0 ? (carbsCal / totalCal) * 100 : 33.3;
  const fatPct = totalCal > 0 ? (fatCal / totalCal) * 100 : 33.4;

  // SVG Donut calculation
  const size = 120;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const proteinStroke = (proteinPct / 100) * circumference;
  const carbsStroke = (carbsPct / 100) * circumference;
  const fatStroke = (fatPct / 100) * circumference;

  const proteinOffset = 0;
  const carbsOffset = -proteinStroke;
  const fatOffset = -(proteinStroke + carbsStroke);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Energy distribution from macros
      </p>

      {totalCal === 0 ? (
        <div className="my-6 flex h-32 items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">No macro data available yet</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
          {/* Donut SVG */}
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90 transform">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-zinc-100 dark:text-zinc-800"
                fill="transparent"
              />
              {/* Protein Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#6366f1"
                strokeWidth={strokeWidth}
                strokeDasharray={`${proteinStroke} ${circumference}`}
                strokeDashoffset={proteinOffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
              {/* Carbs Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#10b981"
                strokeWidth={strokeWidth}
                strokeDasharray={`${carbsStroke} ${circumference}`}
                strokeDashoffset={carbsOffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
              {/* Fat Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#f59e0b"
                strokeWidth={strokeWidth}
                strokeDasharray={`${fatStroke} ${circumference}`}
                strokeDashoffset={fatOffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formatWholeNumber(totalCal)}
              </span>
              <span className="block text-[10px] font-medium text-zinc-400">kcal</span>
            </div>
          </div>

          {/* Legend Details */}
          <div className="w-full max-w-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Protein</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatWholeNumber(totals.protein)}g
                </span>
                <span className="text-zinc-400">({Math.round(proteinPct)}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Carbs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatWholeNumber(totals.carbs)}g
                </span>
                <span className="text-zinc-400">({Math.round(carbsPct)}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Fat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatWholeNumber(totals.fat)}g
                </span>
                <span className="text-zinc-400">({Math.round(fatPct)}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MacroProgressBar({ totals, goal }: { totals: MacroTotals; goal?: { dailyProtein: number; dailyCarbs: number; dailyFat: number } | null }) {
  return (
    <div className="space-y-3">
      {/* Protein Bar */}
      <div>
        <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <span>Protein</span>
          <span>
            {formatWholeNumber(totals.protein)}g {goal ? `/ ${goal.dailyProtein}g` : ""}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${goal ? Math.min((totals.protein / goal.dailyProtein) * 100, 100) : 50}%` }}
          />
        </div>
      </div>

      {/* Carbs Bar */}
      <div>
        <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <span>Carbs</span>
          <span>
            {formatWholeNumber(totals.carbs)}g {goal ? `/ ${goal.dailyCarbs}g` : ""}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${goal ? Math.min((totals.carbs / goal.dailyCarbs) * 100, 100) : 50}%` }}
          />
        </div>
      </div>

      {/* Fat Bar */}
      <div>
        <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <span>Fat</span>
          <span>
            {formatWholeNumber(totals.fat)}g {goal ? `/ ${goal.dailyFat}g` : ""}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${goal ? Math.min((totals.fat / goal.dailyFat) * 100, 100) : 50}%` }}
          />
        </div>
      </div>
    </div>
  );
}
