import { useEffect, useRef, useState } from "react";
import type {
  CreateFoodInput,
  Food,
  FoodFavourite,
  QuantityMode,
} from "../../lib/nutrition/types";
import {
  customAmountFromServings,
  formatNumber,
  formatWholeNumber,
  mealLabel,
  mealOrder,
  servingsFromCustomAmount,
  servingUnits,
} from "../../lib/nutrition/utils";
import {
  MacroPreview,
  NutritionValue,
  QuantityInput,
} from "./EditFoodModal";

type AddFoodTab = "search" | "barcode" | "favourites" | "create";

type AddFoodModalProps = {
  selectedMeal: string;
  selectedDate: string;
  adding: boolean;
  error: string;
  favourites: FoodFavourite[];
  loadingFavourites: boolean;
  onMealChange: (meal: string) => void;
  onSearch: (query: string) => Promise<Food[]>;
  onBarcodeSearch: (barcode: string) => Promise<Food[]>;
  onCreateFood: (input: CreateFoodInput) => Promise<Food>;
  onToggleFavourite: (foodId: string, isFavourite: boolean) => Promise<void>;
  onAdd: (food: Food, servings: number, mealType: string) => Promise<void>;
  onClose: () => void;
};

const emptyCreateForm: CreateFoodInput = {
  name: "",
  brand: "",
  barcode: "",
  servingSize: 100,
  servingUnit: "g",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

export function AddFoodModal({
  selectedMeal,
  adding,
  error,
  favourites,
  loadingFavourites,
  onMealChange,
  onSearch,
  onBarcodeSearch,
  onCreateFood,
  onToggleFavourite,
  onAdd,
  onClose,
}: AddFoodModalProps) {
  const [activeTab, setActiveTab] = useState<AddFoodTab>("search");
  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantityMode, setQuantityMode] = useState<QuantityMode>("servings");
  const [servings, setServings] = useState(1);
  const [customAmount, setCustomAmount] = useState(100);
  const [createForm, setCreateForm] = useState<CreateFoodInput>(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanSupported, setScanSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const favouriteIds = new Set(favourites.map((entry) => entry.foodId));

  useEffect(() => {
    setScanSupported(
      typeof window !== "undefined" && "BarcodeDetector" in window,
    );

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (selectedFood) {
      setCustomAmount(selectedFood.servingSize);
      setServings(1);
      setQuantityMode("servings");
    }
  }, [selectedFood]);

  function stopCamera() {
    if (scanIntervalRef.current !== null) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setScanning(false);
  }

  async function handleSearch() {
    try {
      setSearching(true);
      setLocalError("");

      const result = await onSearch(search.trim());

      setFoods(result);
      setSelectedFood(null);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Unable to search foods.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleBarcodeSearch(value = barcode) {
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    try {
      setSearching(true);
      setLocalError("");

      const result = await onBarcodeSearch(trimmed);

      setFoods(result);

      if (result.length === 1) {
        setSelectedFood(result[0]);
      } else {
        setSelectedFood(null);
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Unable to search barcode.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function startBarcodeScan() {
    if (!scanSupported || !videoRef.current) {
      return;
    }

    try {
      setLocalError("");
      setScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a"],
      });

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current) {
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);

          if (codes.length > 0) {
            const value = codes[0].rawValue;

            stopCamera();
            setBarcode(value);
            await handleBarcodeSearch(value);
          }
        } catch {
          // Ignore intermittent scan errors.
        }
      }, 500);
    } catch (err) {
      stopCamera();
      setLocalError(
        err instanceof Error
          ? err.message
          : "Unable to access camera for barcode scanning.",
      );
    }
  }

  async function handleCreateFood() {
    try {
      setCreating(true);
      setLocalError("");

      const created = await onCreateFood({
        ...createForm,
        brand: createForm.brand?.trim() || undefined,
        barcode: createForm.barcode?.trim() || undefined,
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

  async function handleAddSelected() {
    if (!selectedFood) {
      return;
    }

    const effectiveServings =
      quantityMode === "servings"
        ? servings
        : servingsFromCustomAmount(customAmount, selectedFood);

    await onAdd(selectedFood, effectiveServings, selectedMeal);
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

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Add food</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Search, scan, or create a food for your diary.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            ✕
          </button>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-zinc-700">Meal</label>

          <select
            value={selectedMeal}
            onChange={(event) => onMealChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
          >
            {mealOrder.map((meal) => (
              <option key={meal} value={meal}>
                {mealLabel(meal)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["search", "Search"],
              ["barcode", "Barcode"],
              ["favourites", "Favourites"],
              ["create", "Create food"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab(tab);
                setLocalError("");
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                activeTab === tab
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "search" && (
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
                    handleSearch();
                  }
                }}
                placeholder="e.g. chicken breast"
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
              />

              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {searching ? "..." : "Search"}
              </button>
            </div>

            <FoodResults
              foods={foods}
              favouriteIds={favouriteIds}
              selectedFood={selectedFood}
              onSelect={setSelectedFood}
              onToggleFavourite={handleToggleFavourite}
            />

            {foods.length === 0 && search && !searching && !selectedFood && (
              <p className="mt-4 text-sm text-zinc-500">No foods found.</p>
            )}
          </div>
        )}

        {activeTab === "barcode" && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">
                Barcode
              </label>

              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleBarcodeSearch();
                    }
                  }}
                  placeholder="Enter or scan barcode"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
                />

                <button
                  type="button"
                  onClick={() => handleBarcodeSearch()}
                  disabled={searching}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {searching ? "..." : "Look up"}
                </button>
              </div>
            </div>

            {scanSupported ? (
              <div className="rounded-xl border border-zinc-200 p-4">
                {!scanning ? (
                  <button
                    type="button"
                    onClick={startBarcodeScan}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Scan with camera
                  </button>
                ) : (
                  <div className="space-y-3">
                    <video
                      ref={videoRef}
                      className="aspect-video w-full rounded-lg bg-black object-cover"
                      muted
                      playsInline
                    />

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Stop scanning
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                Camera scanning is not supported in this browser. Enter the
                barcode manually instead.
              </p>
            )}

            <FoodResults
              foods={foods}
              favouriteIds={favouriteIds}
              selectedFood={selectedFood}
              onSelect={setSelectedFood}
              onToggleFavourite={handleToggleFavourite}
            />
          </div>
        )}

        {activeTab === "favourites" && (
          <div className="mt-5">
            {loadingFavourites ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-lg bg-zinc-100"
                  />
                ))}
              </div>
            ) : favourites.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center">
                <p className="text-sm text-zinc-500">No favourite foods yet.</p>

                <p className="mt-1 text-xs text-zinc-400">
                  Star foods while searching to save them here.
                </p>
              </div>
            ) : (
              <FoodResults
                foods={favourites.map((entry) => entry.food)}
                favouriteIds={favouriteIds}
                selectedFood={selectedFood}
                onSelect={setSelectedFood}
                onToggleFavourite={handleToggleFavourite}
              />
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className="mt-5 space-y-4">
            <CreateField
              label="Name"
              value={createForm.name}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, name: value }))
              }
            />

            <CreateField
              label="Brand (optional)"
              value={createForm.brand ?? ""}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, brand: value }))
              }
            />

            <CreateField
              label="Barcode (optional)"
              value={createForm.barcode ?? ""}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, barcode: value }))
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Serving size
                </label>

                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={createForm.servingSize}
                  onChange={(event) => {
                    const value = Number(event.target.value);

                    setCreateForm((current) => ({
                      ...current,
                      servingSize:
                        Number.isFinite(value) && value > 0 ? value : 0.1,
                    }));
                  }}
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">Unit</label>

                <select
                  value={createForm.servingUnit}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      servingUnit: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
                >
                  {servingUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <NumberField
                label="Calories"
                value={createForm.calories}
                onChange={(value) =>
                  setCreateForm((current) => ({ ...current, calories: value }))
                }
              />

              <NumberField
                label="Protein"
                value={createForm.protein}
                onChange={(value) =>
                  setCreateForm((current) => ({ ...current, protein: value }))
                }
              />

              <NumberField
                label="Carbs"
                value={createForm.carbs}
                onChange={(value) =>
                  setCreateForm((current) => ({ ...current, carbs: value }))
                }
              />

              <NumberField
                label="Fat"
                value={createForm.fat}
                onChange={(value) =>
                  setCreateForm((current) => ({ ...current, fat: value }))
                }
              />
            </div>

            <button
              type="button"
              onClick={handleCreateFood}
              disabled={creating || !createForm.name.trim()}
              className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create food"}
            </button>
          </div>
        )}

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

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleFavourite(selectedFood)}
                  className="text-sm"
                  aria-label={
                    favouriteIds.has(selectedFood.id)
                      ? "Remove from favourites"
                      : "Add to favourites"
                  }
                >
                  {favouriteIds.has(selectedFood.id) ? "★" : "☆"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFood(null)}
                  className="text-sm font-medium text-zinc-500 underline"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <NutritionValue
                label="Calories"
                value={`${formatWholeNumber(selectedFood.calories)} kcal`}
              />

              <NutritionValue
                label="Protein"
                value={`${formatWholeNumber(selectedFood.protein)}g`}
              />

              <NutritionValue
                label="Carbs"
                value={`${formatWholeNumber(selectedFood.carbs)}g`}
              />

              <NutritionValue
                label="Fat"
                value={`${formatWholeNumber(selectedFood.fat)}g`}
              />
            </div>

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

            <button
              type="button"
              onClick={handleAddSelected}
              disabled={adding || effectiveServings <= 0}
              className="mt-5 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {adding ? "Adding..." : `Add to ${mealLabel(selectedMeal)}`}
            </button>
          </div>
        )}

        {displayError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
  onSelect,
  onToggleFavourite,
}: {
  foods: Food[];
  favouriteIds: Set<string>;
  selectedFood: Food | null;
  onSelect: (food: Food) => void;
  onToggleFavourite: (food: Food) => void;
}) {
  if (foods.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      {foods.map((food) => (
        <div
          key={food.id}
          className={`flex items-center gap-2 rounded-lg border p-3 transition ${
            selectedFood?.id === food.id
              ? "border-zinc-900 bg-zinc-50"
              : "border-zinc-200 hover:border-zinc-400"
          }`}
        >
          <button
            type="button"
            onClick={() => onToggleFavourite(food)}
            className="shrink-0 text-base leading-none text-amber-500"
            aria-label={
              favouriteIds.has(food.id)
                ? "Remove from favourites"
                : "Add to favourites"
            }
          >
            {favouriteIds.has(food.id) ? "★" : "☆"}
          </button>

          <button
            type="button"
            onClick={() => onSelect(food)}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{food.name}</p>

                {food.brand && (
                  <p className="mt-0.5 text-xs text-zinc-500">{food.brand}</p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-medium">
                  {formatWholeNumber(food.calories)} kcal
                </p>

                <p className="text-xs text-zinc-500">
                  per {food.servingSize} {food.servingUnit}
                </p>
              </div>
            </div>
          </button>
        </div>
      ))}
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
      <label className="text-sm font-medium text-zinc-700">{label}</label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
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
      <label className="text-sm font-medium text-zinc-700">{label}</label>

      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);

          onChange(Number.isFinite(next) && next >= 0 ? next : 0);
        }}
        className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
      />
    </div>
  );
}

declare global {
  interface Window {
    BarcodeDetector: new (options?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
    };
  }
}
