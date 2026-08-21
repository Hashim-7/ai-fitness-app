"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type {
  CreateFoodInput,
  Food,
  FoodFavourite,
  QuantityMode,
  PendingCartItem,
} from "../../lib/nutrition/types";
import {
  formatWholeNumber,
  mealLabel,
  mealOrder,
  servingsFromCustomAmount,
  servingUnits,
  getRecentSearches,
  addRecentSearch,
} from "../../lib/nutrition/utils";
import {
  MacroPreview,
  NutritionValue,
  QuantityInput,
} from "./EditFoodModal";
import { PhotoLogModal } from "./PhotoLogModal";

type AddFoodTab = "search" | "photo" | "favourites" | "create";

type AddFoodModalProps = {
  selectedMeal: string;
  selectedDate: string;
  adding: boolean;
  error: string;
  favourites: FoodFavourite[];
  loadingFavourites: boolean;
  onMealChange: (meal: string) => void;
  onSearch: (query: string) => Promise<Food[]>;
  onBarcodeSearch?: (barcode: string) => Promise<Food[]>;
  onCreateFood: (input: CreateFoodInput) => Promise<Food>;
  onToggleFavourite: (foodId: string, isFavourite: boolean) => Promise<void>;
  onAdd: (food: Food, servings: number, mealType: string) => Promise<void>;
  onClose: () => void;
};

const emptyCreateForm: CreateFoodInput = {
  name: "",
  brand: "",
  servingSize: 100,
  servingUnit: "g",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

export function AddFoodModal({
  selectedMeal,
  selectedDate,
  adding,
  error,
  favourites,
  loadingFavourites,
  onMealChange,
  onSearch,
  onCreateFood,
  onToggleFavourite,
  onAdd,
  onClose,
}: AddFoodModalProps) {
  const [activeTab, setActiveTab] = useState<AddFoodTab>("search");
  const [search, setSearch] = useState("");
  const [recentSearchTags, setRecentSearchTags] = useState<string[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantityMode, setQuantityMode] = useState<QuantityMode>("servings");
  const [servings, setServings] = useState(1);
  const [customAmount, setCustomAmount] = useState(100);
  const [createForm, setCreateForm] = useState<CreateFoodInput>(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState("");

  // Multi-food cart state
  const [cart, setCart] = useState<PendingCartItem[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const favouriteIds = new Set(favourites.map((entry) => entry.foodId));
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRecentSearchTags(getRecentSearches());
  }, []);

  useEffect(() => {
    if (selectedFood) {
      setCustomAmount(selectedFood.servingSize);
      setServings(1);
      setQuantityMode("servings");
    }
  }, [selectedFood]);

  const executeSearch = useCallback(async (query: string) => {
    try {
      setSearching(true);
      setLocalError("");

      const result = await onSearch(query.trim());
      setFoods(result);
      setSelectedIndex(-1);
      if (query.trim()) {
        addRecentSearch(query.trim());
        setRecentSearchTags(getRecentSearches());
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Unable to search foods.",
      );
    } finally {
      setSearching(false);
    }
  }, [onSearch]);

  // Instant Debounced Search
  useEffect(() => {
    if (activeTab !== "search") return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      executeSearch(search);
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, activeTab, executeSearch]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (foods.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < foods.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : foods.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < foods.length) {
      e.preventDefault();
      setSelectedFood(foods[selectedIndex]);
    }
  }

  function handleAddToCart() {
    if (!selectedFood) return;

    const effectiveServings =
      quantityMode === "servings"
        ? servings
        : servingsFromCustomAmount(customAmount, selectedFood);

    setCart((prev) => [
      ...prev,
      {
        food: selectedFood,
        servings: effectiveServings,
        quantityMode,
        customAmount,
      },
    ]);

    setSelectedFood(null);
  }

  function handleRemoveFromCart(index: number) {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleAddAllCartItems() {
    if (cart.length === 0) return;

    try {
      setLocalError("");

      for (const item of cart) {
        await onAdd(item.food, item.servings, selectedMeal);
      }

      setCart([]);
      onClose();
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Unable to add foods to diary.",
      );
    }
  }

  async function handleAddSingleSelected() {
    if (!selectedFood) return;

    const effectiveServings =
      quantityMode === "servings"
        ? servings
        : servingsFromCustomAmount(customAmount, selectedFood);

    await onAdd(selectedFood, effectiveServings, selectedMeal);
    setSelectedFood(null);
  }

  async function handleCreateFood() {
    try {
      setCreating(true);
      setLocalError("");

      const created = await onCreateFood({
        ...createForm,
        brand: createForm.brand?.trim() || undefined,
      });

      setSelectedFood(created);
      setActiveTab("search");
      setCreateForm(emptyCreateForm);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Unable to create food.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleFavourite(food: Food) {
    try {
      setLocalError("");
      await onToggleFavourite(food.id, favouriteIds.has(food.id));
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Unable to update favourite.",
      );
    }
  }

  const effectiveServings = selectedFood
    ? quantityMode === "servings"
      ? servings
      : servingsFromCustomAmount(customAmount, selectedFood)
    : 1;

  const cartTotalCalories = cart.reduce(
    (acc, item) => acc + Math.round(item.food.calories * item.servings),
    0,
  );

  const displayError = localError || error;

  if (showPhotoModal) {
    return (
      <PhotoLogModal
        selectedMeal={selectedMeal}
        selectedDate={selectedDate}
        onMealChange={onMealChange}
        onCreateAndAddFood={async (input, serv, meal) => {
          const created = await onCreateFood(input);
          await onAdd(created, serv, meal);
        }}
        onClose={() => setShowPhotoModal(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:border dark:border-zinc-800 dark:bg-zinc-900">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Add food to {mealLabel(selectedMeal)}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Search database, log via photo, or create custom foods. Multi-item logging supported!
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Meal Selector */}
        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Target Meal</label>
          <select
            value={selectedMeal}
            onChange={(e) => onMealChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {mealOrder.map((meal) => (
              <option key={meal} value={meal}>
                {mealLabel(meal)}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["search", "🔍 Search"],
              ["photo", "📸 AI Photo Log"],
              ["favourites", "⭐ Favourites"],
              ["create", "+ Create food"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (tab === "photo") {
                  setShowPhotoModal(true);
                } else {
                  setActiveTab(tab);
                  setLocalError("");
                }
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab && tab !== "photo"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pending Cart Bar (Multi-Item Logging) */}
        {cart.length > 0 && (
          <div className="mt-4 rounded-2xl bg-indigo-50/70 p-4 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Queued Foods ({cart.length})
                </h4>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Total: {formatWholeNumber(cartTotalCalories)} kcal
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAllCartItems}
                disabled={adding}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {adding ? "Adding..." : `Log all ${cart.length} items`}
              </button>
            </div>

            {/* Cart Items List */}
            <div className="mt-3 max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-xs dark:bg-zinc-900/80"
                >
                  <span className="font-medium truncate text-zinc-900 dark:text-zinc-100">
                    {item.food.name} ({item.servings}x)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      {formatWholeNumber(item.food.calories * item.servings)} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(idx)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 1: Search */}
        {activeTab === "search" && (
          <div className="mt-4">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Instant Search (with debouncing & keyboard navigation)
            </label>

            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search food database (e.g. Oats, Egg, Chicken)..."
                className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
              />
              {searching && (
                <div className="flex items-center px-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                </div>
              )}
            </div>

            {/* Recent Searches Tags */}
            {recentSearchTags.length > 0 && !search && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">Recents:</span>
                {recentSearchTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearch(tag)}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <FoodResults
              foods={foods}
              favouriteIds={favouriteIds}
              selectedFood={selectedFood}
              selectedIndex={selectedIndex}
              onSelect={setSelectedFood}
              onToggleFavourite={handleToggleFavourite}
            />

            {foods.length === 0 && search && !searching && !selectedFood && (
              <div className="mt-6 rounded-xl border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
                <p className="text-xs text-zinc-500">No matching foods found for "{search}".</p>
                <button
                  type="button"
                  onClick={() => {
                    setCreateForm({ ...emptyCreateForm, name: search });
                    setActiveTab("create");
                  }}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Create "{search}" as a new food
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Favourites */}
        {activeTab === "favourites" && (
          <div className="mt-4">
            {loadingFavourites ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : favourites.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No favourite foods yet.</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Star foods while searching to quick-access them here.
                </p>
              </div>
            ) : (
              <FoodResults
                foods={favourites.map((entry) => entry.food)}
                favouriteIds={favouriteIds}
                selectedFood={selectedFood}
                selectedIndex={-1}
                onSelect={setSelectedFood}
                onToggleFavourite={handleToggleFavourite}
              />
            )}
          </div>
        )}

        {/* Tab 3: Create */}
        {activeTab === "create" && (
          <div className="mt-4 space-y-3">
            <CreateField
              label="Food Name"
              value={createForm.name}
              onChange={(value) => setCreateForm((current) => ({ ...current, name: value }))}
            />

            <CreateField
              label="Brand (optional)"
              value={createForm.brand ?? ""}
              onChange={(value) => setCreateForm((current) => ({ ...current, brand: value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Serving Size</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={createForm.servingSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCreateForm((curr) => ({
                      ...curr,
                      servingSize: Number.isFinite(val) && val > 0 ? val : 0.1,
                    }));
                  }}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Unit</label>
                <select
                  value={createForm.servingUnit}
                  onChange={(e) => setCreateForm((curr) => ({ ...curr, servingUnit: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {servingUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <NumberField
                label="Calories"
                value={createForm.calories}
                onChange={(val) => setCreateForm((curr) => ({ ...curr, calories: val }))}
              />
              <NumberField
                label="Protein (g)"
                value={createForm.protein}
                onChange={(val) => setCreateForm((curr) => ({ ...curr, protein: val }))}
              />
              <NumberField
                label="Carbs (g)"
                value={createForm.carbs}
                onChange={(val) => setCreateForm((curr) => ({ ...curr, carbs: val }))}
              />
              <NumberField
                label="Fat (g)"
                value={createForm.fat}
                onChange={(val) => setCreateForm((curr) => ({ ...curr, fat: val }))}
              />
            </div>

            <button
              type="button"
              onClick={handleCreateFood}
              disabled={creating || !createForm.name.trim()}
              className="mt-2 w-full rounded-xl bg-zinc-900 py-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {creating ? "Creating..." : "Save Custom Food"}
            </button>
          </div>
        )}

        {/* Selected Food Panel & Serving Calculator */}
        {selectedFood && (
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedFood.name}</p>
                {selectedFood.brand && (
                  <p className="text-xs text-zinc-400">{selectedFood.brand}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleFavourite(selectedFood)}
                  className="text-base text-amber-500"
                >
                  {favouriteIds.has(selectedFood.id) ? "★" : "☆"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFood(null)}
                  className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Serving & Quantity Calculator */}
            <QuantityInput
              food={selectedFood}
              quantityMode={quantityMode}
              servings={servings}
              customAmount={customAmount}
              disabled={adding}
              onModeChange={setQuantityMode}
              onServingsChange={setServings}
              onCustomAmountChange={setCustomAmount}
            />

            <MacroPreview
              food={selectedFood}
              servings={effectiveServings}
              customAmount={customAmount}
              quantityMode={quantityMode}
            />

            {/* Action Buttons: Multi-Add to Cart vs Direct Add */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={effectiveServings <= 0}
                className="flex-1 rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                + Queue Item
              </button>

              <button
                type="button"
                onClick={handleAddSingleSelected}
                disabled={adding || effectiveServings <= 0}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {adding ? "Adding..." : `Log to ${mealLabel(selectedMeal)}`}
              </button>
            </div>
          </div>
        )}

        {/* Display Errors */}
        {displayError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {displayError}
          </div>
        )}
      </div>
    </div>
  );
}

function FoodResults({
  foods,
  favouriteIds,
  selectedFood,
  selectedIndex,
  onSelect,
  onToggleFavourite,
}: {
  foods: Food[];
  favouriteIds: Set<string>;
  selectedFood: Food | null;
  selectedIndex: number;
  onSelect: (food: Food) => void;
  onToggleFavourite: (food: Food) => void;
}) {
  if (foods.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
      {foods.map((food, idx) => {
        const isSelected = selectedFood?.id === food.id || selectedIndex === idx;

        return (
          <div
            key={food.id}
            className={`flex items-center gap-2 rounded-xl border p-2.5 transition ${
              isSelected
                ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleFavourite(food)}
              className="shrink-0 text-base text-amber-500"
            >
              {favouriteIds.has(food.id) ? "★" : "☆"}
            </button>

            <button
              type="button"
              onClick={() => onSelect(food)}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {food.name}
                  </p>
                  {food.brand && (
                    <p className="truncate text-[10px] text-zinc-400">{food.brand}</p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatWholeNumber(food.calories)} kcal
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    per {food.servingSize} {food.servingUnit}
                  </p>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function CreateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </div>
  );
}
