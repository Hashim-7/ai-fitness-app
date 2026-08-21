import { useEffect, useState } from "react";
import type { Goal, UpsertGoalInput } from "../../lib/nutrition/types";
import { formatWholeNumber } from "../../lib/nutrition/utils";

type EditGoalModalProps = {
  goal: Goal | null;
  saving: boolean;
  error: string;
  onSave: (input: UpsertGoalInput) => Promise<void>;
  onClose: () => void;
};

export function EditGoalModal({
  goal,
  saving,
  error,
  onSave,
  onClose,
}: EditGoalModalProps) {
  const [dailyCalories, setDailyCalories] = useState(
    goal?.dailyCalories ?? 2000,
  );
  const [dailyProtein, setDailyProtein] = useState(goal?.dailyProtein ?? 150);
  const [dailyCarbs, setDailyCarbs] = useState(goal?.dailyCarbs ?? 200);
  const [dailyFat, setDailyFat] = useState(goal?.dailyFat ?? 65);

  useEffect(() => {
    if (goal) {
      setDailyCalories(goal.dailyCalories);
      setDailyProtein(goal.dailyProtein);
      setDailyCarbs(goal.dailyCarbs);
      setDailyFat(goal.dailyFat);
    }
  }, [goal]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Daily goals</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Set your daily calorie and macro targets.
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <GoalField
            label="Calories"
            unit="kcal"
            value={dailyCalories}
            onChange={setDailyCalories}
          />

          <GoalField
            label="Protein"
            unit="g"
            value={dailyProtein}
            onChange={setDailyProtein}
          />

          <GoalField
            label="Carbs"
            unit="g"
            value={dailyCarbs}
            onChange={setDailyCarbs}
          />

          <GoalField
            label="Fat"
            unit="g"
            value={dailyFat}
            onChange={setDailyFat}
          />
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Macro totals should be within ±15% of your calorie target.
        </p>

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
            disabled={saving}
            onClick={() =>
              onSave({
                dailyCalories,
                dailyProtein,
                dailyCarbs,
                dailyFat,
              })
            }
            className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save goals"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-700">{label}</label>

      <div className="relative mt-2">
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);

            onChange(Number.isFinite(next) && next >= 0 ? next : 0);
          }}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 pr-12 text-sm outline-none focus:border-zinc-900"
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
          {unit}
        </span>
      </div>

      <p className="mt-1 text-xs text-zinc-400">
        Current: {formatWholeNumber(value)} {unit}
      </p>
    </div>
  );
}
