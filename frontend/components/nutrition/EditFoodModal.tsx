import { useState } from "react";
import type { DiaryItem, QuantityMode } from "../../lib/nutrition/types";
import {
  customAmountFromServings,
  formatNumber,
  mealLabel,
  mealOrder,
  servingsFromCustomAmount,
} from "../../lib/nutrition/utils";

type EditFoodModalProps = {
  item: DiaryItem;
  saving: boolean;
  error: string;
  onSave: (input: { servings: number; mealType: string }) => Promise<void>;
  onClose: () => void;
};

export function EditFoodModal({
  item,
  saving,
  error,
  onSave,
  onClose,
}: EditFoodModalProps) {
  const [editMeal, setEditMeal] = useState(item.mealType.toUpperCase());
  const [quantityMode, setQuantityMode] = useState<QuantityMode>("servings");
  const [editServings, setEditServings] = useState(item.servings);
  const [customAmount, setCustomAmount] = useState(
    customAmountFromServings(item.servings, item.food),
  );

  const effectiveServings =
    quantityMode === "servings"
      ? editServings
      : servingsFromCustomAmount(customAmount, item.food);

  return (
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
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="font-semibold">{item.food.name}</p>

          {item.food.brand && (
            <p className="mt-0.5 text-xs text-zinc-500">{item.food.brand}</p>
          )}

          <p className="mt-2 text-xs text-zinc-500">
            1 serving = {item.food.servingSize} {item.food.servingUnit}
          </p>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-zinc-700">Meal</label>

          <select
            value={editMeal}
            onChange={(event) => setEditMeal(event.target.value)}
            disabled={saving}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 disabled:opacity-50"
          >
            {mealOrder.map((meal) => (
              <option key={meal} value={meal}>
                {mealLabel(meal)}
              </option>
            ))}
          </select>
        </div>

        <QuantityInput
          food={item.food}
          quantityMode={quantityMode}
          servings={editServings}
          customAmount={customAmount}
          disabled={saving}
          onModeChange={setQuantityMode}
          onServingsChange={setEditServings}
          onCustomAmountChange={setCustomAmount}
        />

        <MacroPreview
          food={item.food}
          servings={effectiveServings}
          customAmount={customAmount}
          quantityMode={quantityMode}
        />

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving || effectiveServings <= 0}
            onClick={() =>
              onSave({
                servings: effectiveServings,
                mealType: editMeal,
              })
            }
            className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

type QuantityInputProps = {
  food: DiaryItem["food"];
  quantityMode: QuantityMode;
  servings: number;
  customAmount: number;
  disabled?: boolean;
  onModeChange: (mode: QuantityMode) => void;
  onServingsChange: (value: number) => void;
  onCustomAmountChange: (value: number) => void;
};

export function QuantityInput({
  food,
  quantityMode,
  servings,
  customAmount,
  disabled = false,
  onModeChange,
  onServingsChange,
  onCustomAmountChange,
}: QuantityInputProps) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">Quantity</label>

        <div className="flex rounded-lg border border-zinc-200 p-0.5 text-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onModeChange("servings")}
            className={`rounded-md px-2.5 py-1 font-medium ${
              quantityMode === "servings"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600"
            }`}
          >
            Servings
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onModeChange("custom")}
            className={`rounded-md px-2.5 py-1 font-medium ${
              quantityMode === "custom"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600"
            }`}
          >
            {food.servingUnit}
          </button>
        </div>
      </div>

      {quantityMode === "servings" ? (
        <>
          <p className="mt-1 text-xs text-zinc-500">
            1 serving = {food.servingSize} {food.servingUnit}
          </p>

          <input
            type="number"
            min="0.1"
            step="0.1"
            value={servings}
            disabled={disabled}
            onChange={(event) => {
              const value = Number(event.target.value);

              onServingsChange(
                Number.isFinite(value) && value > 0 ? value : 0.1,
              );
            }}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 disabled:opacity-50"
          />
        </>
      ) : (
        <>
          <p className="mt-1 text-xs text-zinc-500">
            Enter amount in {food.servingUnit}
          </p>

          <input
            type="number"
            min="0.1"
            step="0.1"
            value={customAmount}
            disabled={disabled}
            onChange={(event) => {
              const value = Number(event.target.value);

              onCustomAmountChange(
                Number.isFinite(value) && value > 0 ? value : 0.1,
              );
            }}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 disabled:opacity-50"
          />
        </>
      )}
    </div>
  );
}

export function MacroPreview({
  food,
  servings,
  customAmount,
  quantityMode,
}: {
  food: DiaryItem["food"];
  servings: number;
  customAmount: number;
  quantityMode: QuantityMode;
}) {
  return (
    <div className="mt-4 rounded-lg bg-zinc-50 p-4">
      <div className="flex justify-between">
        <span className="text-sm text-zinc-500">
          {quantityMode === "servings"
            ? `${servings} × ${food.servingSize} ${food.servingUnit}`
            : `${formatNumber(customAmount)} ${food.servingUnit}`}
        </span>

        <span className="font-semibold">
          {formatNumber(food.calories * servings)} kcal
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-zinc-200 pt-3 text-xs">
        <div>
          <p className="text-zinc-500">Protein</p>

          <p className="mt-1 font-semibold">
            {formatNumber(food.protein * servings)}g
          </p>
        </div>

        <div>
          <p className="text-zinc-500">Carbs</p>

          <p className="mt-1 font-semibold">
            {formatNumber(food.carbs * servings)}g
          </p>
        </div>

        <div>
          <p className="text-zinc-500">Fat</p>

          <p className="mt-1 font-semibold">
            {formatNumber(food.fat * servings)}g
          </p>
        </div>
      </div>
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

export { NutritionValue };
