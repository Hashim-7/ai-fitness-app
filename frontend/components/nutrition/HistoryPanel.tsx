import { useEffect, useMemo, useState } from "react";
import type { DaySummary } from "../../lib/nutrition/types";
import {
  formatDateISO,
  formatShortDate,
  formatWholeNumber,
  getMonthDays,
  isToday,
  parseDateISO,
  today,
} from "../../lib/nutrition/utils";

type HistoryPanelProps = {
  selectedDate: string;
  recentDays: DaySummary[];
  loadingRecent: boolean;
  onSelectDate: (date: string) => void;
  onClose: () => void;
};

export function HistoryPanel({
  selectedDate,
  recentDays,
  loadingRecent,
  onSelectDate,
  onClose,
}: HistoryPanelProps) {
  const initial = parseDateISO(selectedDate);

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    const parsed = parseDateISO(selectedDate);

    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
  }, [selectedDate]);

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear, viewMonth, 1));

  const calendarCells = useMemo(
    () => getMonthDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const recentByDate = useMemo(() => {
    return new Map(recentDays.map((day) => [day.date, day]));
  }, [recentDays]);

  function shiftMonth(delta: number) {
    const date = new Date(viewYear, viewMonth + delta, 1);

    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Nutrition history</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Jump to a date or browse recent days.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            ✕
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
            >
              ←
            </button>

            <p className="text-sm font-semibold">{monthLabel}</p>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              disabled={
                viewYear === parseDateISO(today()).getFullYear() &&
                viewMonth >= parseDateISO(today()).getMonth()
              }
              className="rounded-lg px-2 py-1 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
            >
              →
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, index) => {
              if (!cell.date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const summary = recentByDate.get(cell.date);
              const isFuture = cell.date > today();
              const isSelected = cell.date === selectedDate;
              const hasData = (summary?.itemCount ?? 0) > 0;

              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={isFuture}
                  onClick={() => {
                    onSelectDate(cell.date!);
                    onClose();
                  }}
                  className={`aspect-square rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected
                      ? "bg-zinc-900 font-semibold text-white"
                      : hasData
                        ? "bg-zinc-100 font-medium text-zinc-900 hover:bg-zinc-200"
                        : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-zinc-700">Recent days</h3>

          {loadingRecent ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-lg bg-zinc-100"
                />
              ))}
            </div>
          ) : recentDays.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              No recent diary entries found.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {recentDays.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => {
                    onSelectDate(day.date);
                    onClose();
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition hover:border-zinc-400 ${
                    day.date === selectedDate
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {isToday(day.date) ? "Today" : formatShortDate(day.date)}
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-500">
                      {day.itemCount}{" "}
                      {day.itemCount === 1 ? "item" : "items"} logged
                    </p>
                  </div>

                  <div className="text-right text-xs text-zinc-600">
                    <p className="font-semibold">
                      {formatWholeNumber(day.totals.calories)} kcal
                    </p>

                    <p className="mt-0.5">
                      P {formatWholeNumber(day.totals.protein)}g · C{" "}
                      {formatWholeNumber(day.totals.carbs)}g · F{" "}
                      {formatWholeNumber(day.totals.fat)}g
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function buildRecentDateRange(days: number) {
  const dates: string[] = [];
  const start = parseDateISO(today());

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);

    date.setDate(start.getDate() - index);

    dates.push(formatDateISO(date));
  }

  return dates;
}
