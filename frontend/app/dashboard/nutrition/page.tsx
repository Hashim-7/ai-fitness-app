"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AddFoodModal } from "../../../components/nutrition/AddFoodModal";
import { ConfirmDialog } from "../../../components/nutrition/ConfirmDialog";
import { DateNavigator } from "../../../components/nutrition/DateNavigator";
import { EditFoodModal } from "../../../components/nutrition/EditFoodModal";
import { EditGoalModal } from "../../../components/nutrition/EditGoalModal";
import {
  buildRecentDateRange,
  HistoryPanel,
} from "../../../components/nutrition/HistoryPanel";
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
} from "../../../lib/nutrition/types";
import {
  addDays,
  extractFoods,
  formatDisplayDate,
  formatWholeNumber,
  isToday,
  mealLabel,
  mealOrder,
  progress,
  today,
} from "../../../lib/nutrition/utils";

export default function NutritionPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [diary, setDiary] = useState<DiaryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddFood, setShowAddFood] = useState(false);
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

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState("");

  const [showHistory, setShowHistory] = useState(false);
  const [recentDays, setRecentDays] = useState<DaySummary[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const [copying, setCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const loadDiary = useCallback(async (date: string) => {
    const result = await apiFetch<DiaryResponse>(`/diaries?date=${date}`);

    setDiary(result);
  }, []);

  const loadFavourites = useCallback(async () => {
    const result = await apiFetch<FoodFavourite[]>("/foods/favourites");

    setFavourites(result);
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
    if (showAddFood) {
      setLoadingFavourites(true);

      loadFavourites()
        .catch(() => {
          // Favourites are optional in the add flow.
        })
        .finally(() => {
          setLoadingFavourites(false);
        });
    }
  }, [showAddFood, loadFavourites]);

  useEffect(() => {
    if (showHistory) {
      loadRecentDays();
    }
  }, [showHistory, loadRecentDays]);

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
      await apiFetch(`/foods/${foodId}/favourite`, {
        method: "DELETE",
      });
    } else {
      await apiFetch(`/foods/${foodId}/favourite`, {
        method: "POST",
      });
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

      setShowAddFood(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unable to add food.");

      throw err;
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdateDiaryItem(
    itemId: string,
    input: {
      servings: number;
      mealType: string;
    },
  ) {
    await apiFetch(`/diaries/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });

    await loadDiary(selectedDate);
    await loadRecentDays();
  }

  async function handleDeleteDiaryItem(itemId: string) {
    await apiFetch(`/diaries/items/${itemId}`, {
      method: "DELETE",
    });

    await loadDiary(selectedDate);
    await loadRecentDays();
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

  async function handleCopyPreviousDay() {
    const sourceDate = addDays(selectedDate, -1);

    try {
      setCopying(true);
      setCopyMessage("");

      const source = await apiFetch<DiaryResponse>(
        `/diaries?date=${sourceDate}`,
      );

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

      setCopyMessage(
        `Copied ${source.items.length} item${source.items.length === 1 ? "" : "s"} from ${formatDisplayDate(sourceDate)}.`,
      );
    } catch (err) {
      setCopyMessage(
        err instanceof Error ? err.message : "Unable to copy previous day.",
      );
    } finally {
      setCopying(false);
    }
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

  const totals = diary?.totals ?? {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  const goal = diary?.goal;
  const viewingToday = isToday(selectedDate);
  const hasItems = (diary?.items.length ?? 0) > 0;

  const stats = [
    {
      label: "Calories",
      value: totals.calories,
      target: goal?.dailyCalories ?? null,
      unit: "kcal",
    },
    {
      label: "Protein",
      value: totals.protein,
      target: goal?.dailyProtein ?? null,
      unit: "g",
    },
    {
      label: "Carbs",
      value: totals.carbs,
      target: goal?.dailyCarbs ?? null,
      unit: "g",
    },
    {
      label: "Fat",
      value: totals.fat,
      target: goal?.dailyFat ?? null,
      unit: "g",
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200" />
        </div>

        <div className="mb-6 h-10 w-full max-w-xl animate-pulse rounded bg-zinc-200" />

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
          Nutrition
        </h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-900">Unable to load nutrition</p>

          <p className="mt-1 text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              loadDiary(selectedDate)
                .catch((err) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Unable to load nutrition data.",
                  );
                })
                .finally(() => setLoading(false));
            }}
            className="mt-4 rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Nutrition
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Track your food and daily nutrition.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddFood(true);
            setAddError("");
          }}
          className="inline-flex w-fit items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          + Add food
        </button>
      </div>

      <div className="mb-6">
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onOpenHistory={() => setShowHistory(true)}
          copying={copying}
          onCopyPreviousDay={handleCopyPreviousDay}
        />

        {copyMessage && (
          <p className="mt-3 text-sm text-zinc-600">{copyMessage}</p>
        )}
      </div>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {viewingToday ? "Today's nutrition" : "Daily nutrition"}
            </h2>

            <p className="text-sm text-zinc-500">
              {formatDisplayDate(selectedDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setGoalError("");
              setShowGoalModal(true);
            }}
            className="inline-flex w-fit rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {goal ? "Edit goals" : "Set daily goals"}
          </button>
        </div>

        {!hasItems && (
          <div className="mb-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-5">
            <p className="font-medium text-zinc-800">
              {viewingToday
                ? "Nothing logged yet today"
                : "No data for this day"}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {viewingToday
                ? "Add food to start tracking your nutrition."
                : "You did not log any food on this date."}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const percentage = progress(stat.value, stat.target);

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
                    {formatWholeNumber(stat.value)}
                  </span>

                  <span className="text-sm text-zinc-500">{stat.unit}</span>
                </div>

                <p className="mt-2 text-xs text-zinc-400">
                  {stat.target !== null
                    ? `${formatWholeNumber(stat.target)} ${stat.unit} target`
                    : "No target set"}
                </p>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-all"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {diary?.remaining && goal && viewingToday && (
        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="font-semibold">Remaining today</h2>

            <p className="mt-1 text-sm text-zinc-500">
              How much you have left against your daily targets.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RemainingStat
              label="Calories"
              value={diary.remaining.calories}
              unit="kcal"
            />

            <RemainingStat
              label="Protein"
              value={diary.remaining.protein}
              unit="g"
            />

            <RemainingStat
              label="Carbs"
              value={diary.remaining.carbs}
              unit="g"
            />

            <RemainingStat label="Fat" value={diary.remaining.fat} unit="g" />
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Meals</h2>

          <p className="text-sm text-zinc-500">
            {hasItems
              ? `${diary?.items.length} food ${
                  diary?.items.length === 1 ? "item" : "items"
                } logged${viewingToday ? " today" : ""}.`
              : viewingToday
                ? "Nothing has been logged today yet."
                : "No meals were logged on this date."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {meals.map((meal) => {
            const totalsForMeal = mealTotals.find(
              (entry) => entry.type === meal.type,
            );

            return (
              <div
                key={meal.type}
                className="rounded-xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{mealLabel(meal.type)}</h3>

                  <div className="text-right text-xs text-zinc-600">
                    <p className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                      {formatWholeNumber(totalsForMeal?.calories ?? 0)} kcal
                    </p>

                    {(totalsForMeal?.calories ?? 0) > 0 && (
                      <p className="mt-1">
                        P {formatWholeNumber(totalsForMeal?.protein ?? 0)}g · C{" "}
                        {formatWholeNumber(totalsForMeal?.carbs ?? 0)}g · F{" "}
                        {formatWholeNumber(totalsForMeal?.fat ?? 0)}g
                      </p>
                    )}
                  </div>
                </div>

                {meal.items.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-dashed border-zinc-200 p-6 text-center">
                    <p className="text-sm text-zinc-500">No food logged</p>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMeal(meal.type);
                        setShowAddFood(true);
                        setAddError("");
                      }}
                      className="mt-2 text-sm font-semibold text-zinc-900 underline"
                    >
                      Add food
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {meal.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.food.name}
                          </p>

                          {item.food.brand && (
                            <p className="text-xs text-zinc-400">
                              {item.food.brand}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-zinc-500">
                            {item.servings} × {item.food.servingSize}{" "}
                            {item.food.servingUnit}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium">
                            {formatWholeNumber(item.calories)} kcal
                          </p>

                          <p className="text-xs text-zinc-500">
                            P {formatWholeNumber(item.protein)}g · C{" "}
                            {formatWholeNumber(item.carbs)}g · F{" "}
                            {formatWholeNumber(item.fat)}g
                          </p>

                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setEditError("");
                              }}
                              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget(item);
                                setDeleteError("");
                              }}
                              className="text-xs font-medium text-red-600 hover:text-red-700"
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

      {editingItem && (
        <EditFoodModal
          item={editingItem}
          saving={savingEdit}
          error={editError}
          onClose={() => {
            if (!savingEdit) {
              setEditingItem(null);
            }
          }}
          onSave={async (input) => {
            try {
              setSavingEdit(true);
              setEditError("");

              await handleUpdateDiaryItem(editingItem.id, input);
              setEditingItem(null);
            } catch (err) {
              setEditError(
                err instanceof Error ? err.message : "Unable to update food.",
              );
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
            if (!deleting) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={async () => {
            try {
              setDeleting(true);
              setDeleteError("");

              await handleDeleteDiaryItem(deleteTarget.id);
              setDeleteTarget(null);
            } catch (err) {
              setDeleteError(
                err instanceof Error ? err.message : "Unable to delete food.",
              );
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
            if (!savingGoal) {
              setShowGoalModal(false);
            }
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

function RemainingStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {formatWholeNumber(Math.max(value, 0))}
        <span className="ml-1 text-sm font-normal text-zinc-500">{unit}</span>
      </p>
    </div>
  );
}
