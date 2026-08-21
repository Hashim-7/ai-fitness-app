"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AddFoodModal } from "../../../components/nutrition/AddFoodModal";
import { PhotoLogModal } from "../../../components/nutrition/PhotoLogModal";
import { ConfirmDialog } from "../../../components/nutrition/ConfirmDialog";
import { DateNavigator } from "../../../components/nutrition/DateNavigator";
import { EditFoodModal } from "../../../components/nutrition/EditFoodModal";
import { EditGoalModal } from "../../../components/nutrition/EditGoalModal";
import {
  buildRecentDateRange,
  HistoryPanel,
} from "../../../components/nutrition/HistoryPanel";
import { MacroDonutChart, MacroProgressBar } from "../../../components/nutrition/MacroChart";
import { TrendsAndWeightChart } from "../../../components/nutrition/TrendsAndWeightChart";
import { NutritionInsights } from "../../../components/nutrition/NutritionInsights";
import { apiFetch } from "../../../lib/api";
import type {
  CreateFoodInput,
  DaySummary,
  DiaryItem,
  DiaryResponse,
  Food,
  FoodFavourite,
  FoodSearchResponse,
  UpsertGoalInput,
  WeightLog,
  WeightLogsResponse,
} from "../../../lib/nutrition/types";
import {
  addDays,
  calculateStreak,
  extractFoods,
  formatDisplayDate,
  formatWholeNumber,
  generateNutritionInsights,
  getDailyNote,
  isToday,
  mealLabel,
  mealOrder,
  progress,
  saveDailyNote,
  today,
} from "../../../lib/nutrition/utils";

export default function NutritionPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [diary, setDiary] = useState<DiaryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddFood, setShowAddFood] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("BREAKFAST");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const [favourites, setFavourites] = useState<FoodFavourite[]>([]);
  const [loadingFavourites, setLoadingFavourites] = useState(false);

  const [editingItem, setEditingItem] = useState<DiaryItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<DiaryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Undo delete toast state
  const [lastDeletedItem, setLastDeletedItem] = useState<DiaryItem | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState("");

  const [showHistory, setShowHistory] = useState(false);
  const [recentDays, setRecentDays] = useState<DaySummary[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  const [copying, setCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  // Client-side daily note state
  const [dailyNote, setDailyNoteText] = useState("");

  const loadDiary = useCallback(async (date: string) => {
    const result = await apiFetch<DiaryResponse>(`/diaries?date=${date}`);
    setDiary(result);
  }, []);

  const loadFavourites = useCallback(async () => {
    const result = await apiFetch<FoodFavourite[]>("/foods/favourites");
    setFavourites(result);
  }, []);

  const loadWeightLogs = useCallback(async () => {
    try {
      const res = await apiFetch<WeightLogsResponse>("/weight-logs");
      if (res && Array.isArray(res.data)) {
        setWeightLogs(res.data);
      }
    } catch {
      // Weight logs optional
    }
  }, []);

  const loadRecentDays = useCallback(async () => {
    try {
      setLoadingRecent(true);
      const dates = buildRecentDateRange(14);

      const summaries = await Promise.all(
        dates.map(async (date) => {
          const result = await apiFetch<DiaryResponse>(`/diaries?date=${date}`);
          return {
            date,
            totals: result.totals,
            itemCount: result.items.length,
          } satisfies DaySummary;
        }),
      );

      setRecentDays(summaries.filter((day) => day.itemCount > 0));
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    async function loadNutrition() {
      try {
        setLoading(true);
        setError("");
        await loadDiary(selectedDate);
        setDailyNoteText(getDailyNote(selectedDate));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load nutrition data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadNutrition();
  }, [selectedDate, loadDiary]);

  useEffect(() => {
    loadRecentDays();
    loadWeightLogs();
  }, [loadRecentDays, loadWeightLogs]);

  useEffect(() => {
    if (showAddFood) {
      setLoadingFavourites(true);
      loadFavourites()
        .catch(() => {})
        .finally(() => setLoadingFavourites(false));
    }
  }, [showAddFood, loadFavourites]);

  async function searchFoods(query: string) {
    const result = await apiFetch<FoodSearchResponse>(
      query ? `/foods?name=${encodeURIComponent(query)}` : "/foods",
    );
    return extractFoods(result);
  }

  async function searchBarcode(barcode: string) {
    const result = await apiFetch<FoodSearchResponse>(
      `/foods?barcode=${encodeURIComponent(barcode)}`,
    );
    return extractFoods(result);
  }

  async function createFood(input: CreateFoodInput) {
    const created = await apiFetch<Food>("/foods", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await loadFavourites();
    return created;
  }

  async function toggleFavourite(foodId: string, isFavourite: boolean) {
    if (isFavourite) {
      await apiFetch(`/foods/${foodId}/favourite`, { method: "DELETE" });
    } else {
      await apiFetch(`/foods/${foodId}/favourite`, { method: "POST" });
    }
    await loadFavourites();
  }

  async function handleAddFood(food: Food, servings: number, mealType: string) {
    try {
      setAdding(true);
      setAddError("");

      await apiFetch("/diaries/items", {
        method: "POST",
        body: JSON.stringify({
          date: selectedDate,
          mealType,
          foodId: food.id,
          servings,
        }),
      });

      await loadDiary(selectedDate);
      await loadRecentDays();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unable to add food.");
      throw err;
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdateDiaryItem(
    itemId: string,
    input: { servings: number; mealType: string },
  ) {
    await apiFetch(`/diaries/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });

    await loadDiary(selectedDate);
    await loadRecentDays();
  }

  async function handleDeleteDiaryItem(item: DiaryItem) {
    await apiFetch(`/diaries/items/${item.id}`, { method: "DELETE" });
    setLastDeletedItem(item);
    setShowUndoToast(true);
    setTimeout(() => setShowUndoToast(false), 6000);

    await loadDiary(selectedDate);
    await loadRecentDays();
  }

  async function handleUndoDelete() {
    if (!lastDeletedItem) return;
    try {
      await apiFetch("/diaries/items", {
        method: "POST",
        body: JSON.stringify({
          date: selectedDate,
          mealType: lastDeletedItem.mealType,
          foodId: lastDeletedItem.food.id,
          servings: lastDeletedItem.servings,
        }),
      });

      setShowUndoToast(false);
      setLastDeletedItem(null);
      await loadDiary(selectedDate);
      await loadRecentDays();
    } catch {
      // Ignore undo error
    }
  }

  async function handleSaveGoal(input: UpsertGoalInput) {
    try {
      setSavingGoal(true);
      setGoalError("");

      await apiFetch("/goals/me", {
        method: "PUT",
        body: JSON.stringify(input),
      });

      await loadDiary(selectedDate);
      setShowGoalModal(false);
    } catch (err) {
      setGoalError(
        err instanceof Error ? err.message : "Unable to save daily goals.",
      );
    } finally {
      setSavingGoal(false);
    }
  }

  async function handleRepeatMeal(mealType: string) {
    const yesterday = addDays(selectedDate, -1);
    try {
      setCopying(true);
      setCopyMessage("");
      const prevDiary = await apiFetch<DiaryResponse>(`/diaries?date=${yesterday}`);
      const itemsToCopy = prevDiary.items.filter((it) => it.mealType.toUpperCase() === mealType.toUpperCase());

      if (itemsToCopy.length === 0) {
        setCopyMessage(`No ${mealLabel(mealType)} items found on ${formatDisplayDate(yesterday)}.`);
        return;
      }

      for (const item of itemsToCopy) {
        await apiFetch("/diaries/items", {
          method: "POST",
          body: JSON.stringify({
            date: selectedDate,
            mealType: item.mealType,
            foodId: item.food.id,
            servings: item.servings,
          }),
        });
      }

      await loadDiary(selectedDate);
      await loadRecentDays();
      setCopyMessage(`Repeated ${mealLabel(mealType)} (${itemsToCopy.length} items) from yesterday.`);
    } catch (err) {
      setCopyMessage(err instanceof Error ? err.message : "Unable to repeat meal.");
    } finally {
      setCopying(false);
    }
  }

  async function handleCopyPreviousDay() {
    const sourceDate = addDays(selectedDate, -1);
    try {
      setCopying(true);
      setCopyMessage("");

      const source = await apiFetch<DiaryResponse>(`/diaries?date=${sourceDate}`);
      if (source.items.length === 0) {
        setCopyMessage(`No meals found on ${formatDisplayDate(sourceDate)}.`);
        return;
      }

      for (const item of source.items) {
        await apiFetch("/diaries/items", {
          method: "POST",
          body: JSON.stringify({
            date: selectedDate,
            mealType: item.mealType,
            foodId: item.food.id,
            servings: item.servings,
          }),
        });
      }

      await loadDiary(selectedDate);
      await loadRecentDays();
      setCopyMessage(`Copied ${source.items.length} items from ${formatDisplayDate(sourceDate)}.`);
    } catch (err) {
      setCopyMessage(err instanceof Error ? err.message : "Unable to copy previous day.");
    } finally {
      setCopying(false);
    }
  }

  function handleSaveNote(text: string) {
    setDailyNoteText(text);
    saveDailyNote(selectedDate, text);
  }

  const meals = useMemo(() => {
    const items = diary?.items ?? [];
    return mealOrder.map((type) => ({
      type,
      items: items.filter((item) => item.mealType.toUpperCase() === type),
    }));
  }, [diary]);

  const mealTotals = useMemo(() => {
    return meals.map((meal) => ({
      type: meal.type,
      calories: meal.items.reduce((total, item) => total + item.calories, 0),
      protein: meal.items.reduce((total, item) => total + item.protein, 0),
      carbs: meal.items.reduce((total, item) => total + item.carbs, 0),
      fat: meal.items.reduce((total, item) => total + item.fat, 0),
    }));
  }, [meals]);

  const recentUniqueFoods = useMemo(() => {
    const uniqueMap = new Map<string, Food>();
    diary?.items.forEach((item) => {
      if (item.food) uniqueMap.set(item.food.id, item.food);
    });
    return Array.from(uniqueMap.values()).slice(0, 6);
  }, [diary]);

  const streak = useMemo(() => {
    return calculateStreak(recentDays.map((d) => d.date));
  }, [recentDays]);

  const insights = useMemo(() => {
    return generateNutritionInsights(recentDays, diary?.goal ?? null);
  }, [recentDays, diary?.goal]);

  const totals = diary?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goal = diary?.goal;
  const viewingToday = isToday(selectedDate);
  const hasItems = (diary?.items.length ?? 0) > 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          Nutrition Tracker
        </h1>
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="font-semibold text-red-900 dark:text-red-200">Unable to load nutrition data</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              loadDiary(selectedDate).finally(() => setLoading(false));
            }}
            className="mt-4 rounded-xl bg-red-900 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Top Header & AI Quick Log Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">
            Nutrition & Food Diary
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Log meals, track macro distributions, and analyze food photos with AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPhotoModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-95"
          >
            ✨ AI Photo Log
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAddFood(true);
              setAddError("");
            }}
            className="inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Add Food
          </button>
        </div>
      </div>

      {/* Date Navigator */}
      <div>
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onOpenHistory={() => setShowHistory(true)}
          copying={copying}
          onCopyPreviousDay={handleCopyPreviousDay}
        />
        {copyMessage && (
          <p className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">{copyMessage}</p>
        )}
      </div>

      {/* Streak & Achievement Indicators */}
      <NutritionInsights
        streak={streak}
        insights={insights}
        goal={goal}
        todayTotals={totals}
      />

      {/* Calorie Goal & Macro Breakdown Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Consumed vs Goal Card */}
        <section className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {viewingToday ? "Today's Energy Intake" : "Daily Energy Intake"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDisplayDate(selectedDate)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setGoalError("");
                setShowGoalModal(true);
              }}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {goal ? "Edit Daily Targets" : "Set Target Goals"}
            </button>
          </div>

          {/* Consumed vs Target Summary */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Consumed</span>
              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatWholeNumber(totals.calories)} <span className="text-xs font-normal">kcal</span>
              </p>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Target</span>
              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {goal ? formatWholeNumber(goal.dailyCalories) : "--"}{" "}
                <span className="text-xs font-normal">kcal</span>
              </p>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Remaining</span>
              <p className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {goal ? formatWholeNumber(goal.dailyCalories - totals.calories) : "--"}{" "}
                <span className="text-xs font-normal">kcal</span>
              </p>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Completion</span>
              <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {goal ? `${Math.round(progress(totals.calories, goal.dailyCalories))}%` : "--"}
              </p>
            </div>
          </div>

          {/* Macro Progress Bars */}
          <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <MacroProgressBar totals={totals} goal={goal} />
          </div>
        </section>

        {/* Macro Donut Chart Card */}
        <div>
          <MacroDonutChart totals={totals} title="Macro Distribution" />
        </div>
      </div>

      {/* Visual Trends & Weight Integration */}
      <TrendsAndWeightChart
        recentDays={recentDays}
        weightLogs={weightLogs}
        dailyCalorieGoal={goal?.dailyCalories}
      />

      {/* Quick-Add Recent Foods Section */}
      {recentUniqueFoods.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">⚡ Quick Re-log Recent Foods</h3>
            <span className="text-xs text-zinc-400">One-tap add to current meal</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {recentUniqueFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => handleAddFood(food, 1, selectedMeal)}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <span>+ {food.name}</span>
                <span className="text-[10px] text-zinc-400">({food.calories} kcal)</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Meals Log Section */}
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Meals & Diary Items</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {hasItems
                ? `${diary?.items.length} items logged`
                : "No meals logged for this date yet."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {meals.map((meal) => {
            const totalsForMeal = mealTotals.find((entry) => entry.type === meal.type);

            return (
              <div
                key={meal.type}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{mealLabel(meal.type)}</h3>
                    <p className="text-xs text-zinc-400">
                      {formatWholeNumber(totalsForMeal?.calories ?? 0)} kcal
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Repeat Meal Button */}
                    <button
                      type="button"
                      onClick={() => handleRepeatMeal(meal.type)}
                      title={`Repeat yesterday's ${mealLabel(meal.type)}`}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      🔁 Repeat
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMeal(meal.type);
                        setShowAddFood(true);
                        setAddError("");
                      }}
                      className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {meal.items.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-5 text-center dark:border-zinc-800">
                    <p className="text-xs text-zinc-400">No foods logged for {mealLabel(meal.type)}</p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {meal.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 p-3 transition hover:bg-zinc-50/50 dark:border-zinc-800/80 dark:hover:bg-zinc-800/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {item.food.name}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {item.servings} × {item.food.servingSize} {item.food.servingUnit}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {formatWholeNumber(item.calories)} kcal
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            P {formatWholeNumber(item.protein)}g · C {formatWholeNumber(item.carbs)}g · F {formatWholeNumber(item.fat)}g
                          </p>
                          <div className="mt-1 flex justify-end gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setEditError("");
                              }}
                              className="font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget(item);
                                setDeleteError("");
                              }}
                              className="font-semibold text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Daily Notes Section (Client-side localStorage) */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">📝 Daily Notes & Reflection</h3>
        <p className="text-xs text-zinc-400">Note down how you felt, energy levels, or workout thoughts for this day.</p>
        <textarea
          rows={2}
          value={dailyNote}
          onChange={(e) => handleSaveNote(e.target.value)}
          placeholder="Write daily notes..."
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </section>

      {/* Undo Delete Toast Notification */}
      {showUndoToast && lastDeletedItem && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center justify-between gap-4 rounded-2xl bg-zinc-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl dark:bg-zinc-100 dark:text-zinc-900">
          <span>Deleted {lastDeletedItem.food.name}</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Undo
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddFood && (
        <AddFoodModal
          selectedMeal={selectedMeal}
          selectedDate={selectedDate}
          adding={adding}
          error={addError}
          favourites={favourites}
          loadingFavourites={loadingFavourites}
          onMealChange={setSelectedMeal}
          onSearch={searchFoods}
          onBarcodeSearch={searchBarcode}
          onCreateFood={createFood}
          onToggleFavourite={toggleFavourite}
          onAdd={handleAddFood}
          onClose={() => setShowAddFood(false)}
        />
      )}

      {showPhotoModal && (
        <PhotoLogModal
          selectedMeal={selectedMeal}
          selectedDate={selectedDate}
          onMealChange={setSelectedMeal}
          onCreateAndAddFood={async (input, serv, meal) => {
            const created = await createFood(input);
            await handleAddFood(created, serv, meal);
          }}
          onClose={() => setShowPhotoModal(false)}
        />
      )}

      {editingItem && (
        <EditFoodModal
          item={editingItem}
          saving={savingEdit}
          error={editError}
          onClose={() => {
            if (!savingEdit) setEditingItem(null);
          }}
          onSave={async (input) => {
            try {
              setSavingEdit(true);
              setEditError("");
              await handleUpdateDiaryItem(editingItem.id, input);
              setEditingItem(null);
            } catch (err) {
              setEditError(err instanceof Error ? err.message : "Unable to update food.");
            } finally {
              setSavingEdit(false);
            }
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove food?"
          message={`Remove ${deleteTarget.food.name} from your diary?`}
          confirmLabel="Delete"
          destructive
          loading={deleting}
          error={deleteError}
          onCancel={() => {
            if (!deleting) setDeleteTarget(null);
          }}
          onConfirm={async () => {
            try {
              setDeleting(true);
              setDeleteError("");
              await handleDeleteDiaryItem(deleteTarget);
              setDeleteTarget(null);
            } catch (err) {
              setDeleteError(err instanceof Error ? err.message : "Unable to delete food.");
            } finally {
              setDeleting(false);
            }
          }}
        />
      )}

      {showGoalModal && (
        <EditGoalModal
          goal={goal ?? null}
          saving={savingGoal}
          error={goalError}
          onClose={() => {
            if (!savingGoal) setShowGoalModal(false);
          }}
          onSave={handleSaveGoal}
        />
      )}

      {showHistory && (
        <HistoryPanel
          selectedDate={selectedDate}
          recentDays={recentDays}
          loadingRecent={loadingRecent}
          onSelectDate={setSelectedDate}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
