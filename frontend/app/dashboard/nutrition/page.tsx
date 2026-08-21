"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

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
  brand?: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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

type FoodSearchResponse =
  | Food[]
  | {
      foods?: Food[];
      data?: Food[];
      items?: Food[];
    };

const mealOrder = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

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

function progress(value: number, target: number | null) {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.min((value / target) * 100, 100);
}

function extractFoods(result: FoodSearchResponse): Food[] {
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

export default function NutritionPage() {
  const [diary, setDiary] = useState<DiaryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("BREAKFAST");

  const [search, setSearch] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servings, setServings] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const [editingItem, setEditingItem] = useState<DiaryItem | null>(null);
  const [editServings, setEditServings] = useState(1);
  const [editMeal, setEditMeal] = useState("BREAKFAST");
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadDiary() {
    const result = await apiFetch<DiaryResponse>(`/diaries?date=${today()}`);

    setDiary(result);
  }

  useEffect(() => {
    async function loadNutrition() {
      try {
        setLoading(true);
        setError("");

        await loadDiary();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load nutrition data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadNutrition();
  }, []);

  async function searchFoods() {
    try {
      setSearching(true);
      setAddError("");

      const query = search.trim();

      const result = await apiFetch<FoodSearchResponse>(
        query ? `/foods?name=${encodeURIComponent(query)}` : "/foods",
      );

      setFoods(extractFoods(result));
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Unable to search foods.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleAddFood() {
    if (!selectedFood) {
      return;
    }

    try {
      setAdding(true);
      setAddError("");

      await apiFetch("/diaries/items", {
        method: "POST",
        body: JSON.stringify({
          date: today(),
          mealType: selectedMeal,
          foodId: selectedFood.id,
          servings,
        }),
      });

      setSelectedFood(null);
      setServings(1);
      setSearch("");
      setFoods([]);

      await loadDiary();

      setShowAddFood(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unable to add food.");
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdateDiaryItem(
    itemId: string,
    input: {
      servings?: number;
      mealType?: string;
    },
  ) {
    try {
      setAddError("");

      await apiFetch(`/diaries/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });

      await loadDiary();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Unable to update food.",
      );
    }
  }

  async function handleDeleteDiaryItem(itemId: string) {
    try {
      setAddError("");

      await apiFetch(`/diaries/items/${itemId}`, {
        method: "DELETE",
      });

      await loadDiary();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Unable to delete food.",
      );
    }
  }

  const meals = useMemo(() => {
    const items = diary?.items ?? [];

    return mealOrder.map((type) => ({
      type,
      items: items.filter((item) => item.mealType.toUpperCase() === type),
    }));
  }, [diary]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
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
          Nutrition
        </h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-900">Unable to load nutrition</p>

          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const totals = diary?.totals ?? {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  const goal = diary?.goal;

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

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
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
            setSelectedFood(null);
            setFoods([]);
            setSearch("");
            setAddError("");
          }}
          className="inline-flex w-fit items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          + Add food
        </button>
      </div>

      {/* Daily summary */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Today&apos;s nutrition</h2>

          <p className="text-sm text-zinc-500">
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </p>
        </div>

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
                    {formatNumber(stat.value)}
                  </span>

                  <span className="text-sm text-zinc-500">{stat.unit}</span>
                </div>

                <p className="mt-2 text-xs text-zinc-400">
                  {stat.target !== null
                    ? `${formatNumber(stat.target)} ${stat.unit} target`
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

      {/* Remaining */}
      {diary?.remaining && goal && (
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

      {/* Meals */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Meals</h2>

          <p className="text-sm text-zinc-500">
            {diary?.items.length
              ? `${diary.items.length} food ${
                  diary.items.length === 1 ? "item" : "items"
                } logged today.`
              : "Nothing has been logged today yet."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{mealLabel(meal.type)}</h3>

                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                    {formatNumber(calories)} kcal
                  </span>
                </div>

                {meal.items.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-dashed border-zinc-200 p-6 text-center">
                    <p className="text-sm text-zinc-500">No food logged</p>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMeal(meal.type);
                        setShowAddFood(true);
                        setSelectedFood(null);
                        setFoods([]);
                        setSearch("");
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
                            {formatNumber(item.calories)} kcal
                          </p>

                          <p className="text-xs text-zinc-500">
                            {formatNumber(item.protein)}g protein
                          </p>

                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setEditServings(item.servings);
                                setEditMeal(item.mealType.toUpperCase());
                                setAddError("");
                              }}
                              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  `Remove ${item.food.name} from your diary?`,
                                );

                                if (!confirmed) {
                                  return;
                                }

                                await handleDeleteDiaryItem(item.id);
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

      {/* Add Food Modal */}
      {showAddFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Add food</h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Add a food to your diary.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddFood(false)}
                className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              >
                ✕
              </button>
            </div>

            {/* Meal */}
            <div className="mt-6">
              <label className="text-sm font-medium text-zinc-700">Meal</label>

              <select
                value={selectedMeal}
                onChange={(event) => setSelectedMeal(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
              >
                {mealOrder.map((meal) => (
                  <option key={meal} value={meal}>
                    {mealLabel(meal)}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="mt-5">
              <label className="text-sm font-medium text-zinc-700">
                Search food
              </label>

              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      searchFoods();
                    }
                  }}
                  placeholder="e.g. chicken breast"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
                />

                <button
                  type="button"
                  onClick={searchFoods}
                  disabled={searching}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {searching ? "..." : "Search"}
                </button>
              </div>
            </div>

            {/* Search results */}
            {foods.length > 0 && !selectedFood && (
              <div className="mt-4 space-y-2">
                {foods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => setSelectedFood(food)}
                    className="w-full rounded-lg border border-zinc-200 p-4 text-left transition hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {food.name}
                        </p>

                        {food.brand && (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {food.brand}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium">
                          {formatNumber(food.calories)} kcal
                        </p>

                        <p className="text-xs text-zinc-500">
                          per {food.servingSize} {food.servingUnit}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {foods.length === 0 && search && !searching && !selectedFood && (
              <p className="mt-4 text-sm text-zinc-500">No foods found.</p>
            )}

            {/* Selected food */}
            {selectedFood && (
              <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{selectedFood.name}</p>

                    {selectedFood.brand && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {selectedFood.brand}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="text-sm font-medium text-zinc-500 underline"
                  >
                    Change
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <NutritionValue
                    label="Calories"
                    value={`${formatNumber(selectedFood.calories)} kcal`}
                  />

                  <NutritionValue
                    label="Protein"
                    value={`${formatNumber(selectedFood.protein)}g`}
                  />

                  <NutritionValue
                    label="Carbs"
                    value={`${formatNumber(selectedFood.carbs)}g`}
                  />

                  <NutritionValue
                    label="Fat"
                    value={`${formatNumber(selectedFood.fat)}g`}
                  />
                </div>

                <div className="mt-5">
                  <label className="text-sm font-medium text-zinc-700">
                    Servings
                  </label>

                  <p className="mt-1 text-xs text-zinc-500">
                    1 serving = {selectedFood.servingSize}{" "}
                    {selectedFood.servingUnit}
                  </p>

                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={servings}
                    onChange={(event) => {
                      const value = Number(event.target.value);

                      setServings(
                        Number.isFinite(value) && value > 0 ? value : 0.1,
                      );
                    }}
                    className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="mt-4 rounded-lg bg-white p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">
                      {servings} × {selectedFood.servingSize}{" "}
                      {selectedFood.servingUnit}
                    </span>

                    <span className="font-semibold">
                      {formatNumber(selectedFood.calories * servings)} kcal
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-3 text-xs">
                    <div>
                      <p className="text-zinc-500">Protein</p>
                      <p className="mt-1 font-semibold">
                        {formatNumber(selectedFood.protein * servings)}g
                      </p>
                    </div>

                    <div>
                      <p className="text-zinc-500">Carbs</p>
                      <p className="mt-1 font-semibold">
                        {formatNumber(selectedFood.carbs * servings)}g
                      </p>
                    </div>

                    <div>
                      <p className="text-zinc-500">Fat</p>
                      <p className="mt-1 font-semibold">
                        {formatNumber(selectedFood.fat * servings)}g
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddFood}
                  disabled={adding}
                  className="mt-5 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {adding ? "Adding..." : `Add to ${mealLabel(selectedMeal)}`}
                </button>
              </div>
            )}

            {addError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {addError}
              </div>
            )}
          </div>
        </div>
      )}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Edit food</h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Update the amount or meal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              >
                ✕
              </button>
            </div>

            {/* Food */}
            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-semibold">{editingItem.food.name}</p>

              {editingItem.food.brand && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {editingItem.food.brand}
                </p>
              )}

              <p className="mt-2 text-xs text-zinc-500">
                1 serving = {editingItem.food.servingSize}{" "}
                {editingItem.food.servingUnit}
              </p>
            </div>

            {/* Meal */}
            <div className="mt-5">
              <label className="text-sm font-medium text-zinc-700">Meal</label>

              <select
                value={editMeal}
                onChange={(event) => setEditMeal(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
              >
                {mealOrder.map((meal) => (
                  <option key={meal} value={meal}>
                    {mealLabel(meal)}
                  </option>
                ))}
              </select>
            </div>

            {/* Servings */}
            <div className="mt-5">
              <label className="text-sm font-medium text-zinc-700">
                Servings
              </label>

              <p className="mt-1 text-xs text-zinc-500">
                1 serving = {editingItem.food.servingSize}{" "}
                {editingItem.food.servingUnit}
              </p>

              <input
                type="number"
                min="0.1"
                step="0.1"
                value={editServings}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  setEditServings(
                    Number.isFinite(value) && value > 0 ? value : 0.1,
                  );
                }}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
              />
            </div>

            {/* Preview */}
            <div className="mt-4 rounded-lg bg-zinc-50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">
                  {editServings} × {editingItem.food.servingSize}{" "}
                  {editingItem.food.servingUnit}
                </span>

                <span className="font-semibold">
                  {formatNumber(editingItem.food.calories * editServings)} kcal
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 border-t border-zinc-200 pt-3 text-xs">
                <div>
                  <p className="text-zinc-500">Protein</p>

                  <p className="mt-1 font-semibold">
                    {formatNumber(editingItem.food.protein * editServings)}g
                  </p>
                </div>

                <div>
                  <p className="text-zinc-500">Carbs</p>

                  <p className="mt-1 font-semibold">
                    {formatNumber(editingItem.food.carbs * editServings)}g
                  </p>
                </div>

                <div>
                  <p className="text-zinc-500">Fat</p>

                  <p className="mt-1 font-semibold">
                    {formatNumber(editingItem.food.fat * editServings)}g
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={savingEdit}
                onClick={async () => {
                  try {
                    setSavingEdit(true);
                    setAddError("");

                    await handleUpdateDiaryItem(editingItem.id, {
                      servings: editServings,
                      mealType: editMeal,
                    });

                    setEditingItem(null);
                  } finally {
                    setSavingEdit(false);
                  }
                }}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NutritionValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>

      <p className="mt-1 font-semibold">{value}</p>
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
        {formatNumber(Math.max(value, 0))}
        <span className="ml-1 text-sm font-normal text-zinc-500">{unit}</span>
      </p>
    </div>
  );
}
