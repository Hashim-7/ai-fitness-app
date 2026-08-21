"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateNavigator } from "../../../components/nutrition/DateNavigator";
import { AiFormReviewModal } from "../../../components/workouts/AiFormReviewModal";
import { ConfirmDialog } from "../../../components/nutrition/ConfirmDialog";
import { apiFetch } from "../../../lib/api";
import {
  today,
  formatDisplayDate,
  isToday,
  formatWholeNumber,
} from "../../../lib/nutrition/utils";

type Exercise = {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment?: string | null;
};

type WorkoutItem = {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps?: number | null;
  weightKg?: number | null;
  durationSeconds?: number | null;
  caloriesBurned?: number | null;
  notes?: string | null;
};

type WorkoutResponse = {
  id?: string;
  date: string;
  exercises: WorkoutItem[];
  totals: {
    totalExercises: number;
    totalSets: number;
    totalReps: number;
    totalWeightKg: number;
    totalDurationSeconds: number;
    totalCaloriesBurned: number;
  };
};

export default function WorkoutsPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [workout, setWorkout] = useState<WorkoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFormReviewModal, setShowFormReviewModal] = useState(false);
  const [reviewExerciseName, setReviewExerciseName] = useState("");

  // Add exercise state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weightKg, setWeightKg] = useState(60);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [loggingItem, setLoggingItem] = useState(false);
  const [modalError, setModalError] = useState("");

  // Edit / Delete state
  const [editingItem, setEditingItem] = useState<WorkoutItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Custom exercise form
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExCategory, setNewExCategory] = useState("STRENGTH");
  const [newExMuscleGroup, setNewExMuscleGroup] = useState("FULL_BODY");
  const [newExEquipment, setNewExEquipment] = useState("");
  const [creatingEx, setCreatingEx] = useState(false);

  const loadWorkout = useCallback(async (date: string) => {
    const result = await apiFetch<WorkoutResponse>(`/workouts?date=${date}`);
    setWorkout(result);
  }, []);

  const loadExercises = useCallback(async (query = "") => {
    const result = await apiFetch<Exercise[]>(
      query ? `/exercises?name=${encodeURIComponent(query)}` : "/exercises",
    );
    setExercises(result);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        await loadWorkout(selectedDate);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load workout session.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedDate, loadWorkout]);

  useEffect(() => {
    if (showAddModal) {
      loadExercises(searchQuery);
    }
  }, [showAddModal, searchQuery, loadExercises]);

  async function handleAddWorkoutItem() {
    if (!selectedExercise) return;
    try {
      setLoggingItem(true);
      setModalError("");

      await apiFetch("/workouts/items", {
        method: "POST",
        body: JSON.stringify({
          date: selectedDate,
          exerciseId: selectedExercise.id,
          sets,
          reps: reps || undefined,
          weightKg: weightKg || undefined,
          durationSeconds: durationMinutes ? durationMinutes * 60 : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      await loadWorkout(selectedDate);
      setShowAddModal(false);
      setSelectedExercise(null);
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Unable to log exercise.",
      );
    } finally {
      setLoggingItem(false);
    }
  }

  async function handleCreateCustomExercise() {
    if (!newExName.trim()) return;
    try {
      setCreatingEx(true);
      setModalError("");

      const created = await apiFetch<Exercise>("/exercises", {
        method: "POST",
        body: JSON.stringify({
          name: newExName.trim(),
          category: newExCategory,
          muscleGroup: newExMuscleGroup,
          equipment: newExEquipment.trim() || undefined,
        }),
      });

      setSelectedExercise(created);
      setShowCreateExercise(false);
      await loadExercises("");
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Unable to create exercise.",
      );
    } finally {
      setCreatingEx(false);
    }
  }

  async function handleUpdateWorkoutItem() {
    if (!editingItem) return;
    try {
      setLoggingItem(true);
      await apiFetch(`/workouts/items/${editingItem.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          sets,
          reps: reps || undefined,
          weightKg: weightKg || undefined,
          durationSeconds: durationMinutes ? durationMinutes * 60 : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      await loadWorkout(selectedDate);
      setEditingItem(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update exercise.",
      );
    } finally {
      setLoggingItem(false);
    }
  }

  async function handleDeleteItem() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await apiFetch(`/workouts/items/${deleteTarget.id}`, {
        method: "DELETE",
      });
      await loadWorkout(selectedDate);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete item.");
    } finally {
      setDeleting(false);
    }
  }

  const totals = workout?.totals ?? {
    totalExercises: 0,
    totalSets: 0,
    totalReps: 0,
    totalWeightKg: 0,
    totalDurationSeconds: 0,
    totalCaloriesBurned: 0,
  };

  const viewingToday = isToday(selectedDate);
  const items = workout?.exercises ?? [];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">
            Workout Tracker & Form AI
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Log exercises, sets, reps, weight, and review execution form with
            Gemini Vision AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setReviewExerciseName("");
              setShowFormReviewModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:opacity-95"
          >
            🎥 AI Form Review
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAddModal(true);
              setSelectedExercise(null);
            }}
            className="inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Log Exercise
          </button>
        </div>
      </div>

      {/* Date Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOpenHistory={() => {}}
        copying={false}
        onCopyPreviousDay={() => {}}
      />

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Exercises
          </span>
          <p className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {totals.totalExercises}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Sets
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totals.totalSets}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Volume
          </span>
          <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {formatWholeNumber(totals.totalWeightKg)}{" "}
            <span className="text-xs font-normal">kg</span>
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Duration
          </span>
          <p className="mt-1 text-2xl font-black text-amber-500">
            {Math.round(totals.totalDurationSeconds / 60)}{" "}
            <span className="text-xs font-normal">min</span>
          </p>
        </div>
      </div>

      {/* Logged Exercises List */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {viewingToday
                ? "Today's Logged Workout"
                : `Workout on ${formatDisplayDate(selectedDate)}`}
            </h2>
            <p className="text-xs text-zinc-400">
              {items.length === 0
                ? "No exercises logged yet"
                : `${items.length} exercise${items.length === 1 ? "" : "s"} logged`}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Nothing logged yet for this date.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Click "+ Log Exercise" to record your sets and reps.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              + Log Exercise
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      {item.exercise.category}
                    </span>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                      {item.exercise.name}
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.sets} set{item.sets === 1 ? "" : "s"}
                    {item.reps ? ` × ${item.reps} reps` : ""}
                    {item.weightKg ? ` @ ${item.weightKg} kg` : ""}
                    {item.durationSeconds
                      ? ` (${Math.round(item.durationSeconds / 60)} min)`
                      : ""}
                  </p>

                  {item.notes && (
                    <p className="mt-1 text-xs italic text-zinc-400">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewExerciseName(item.exercise.name);
                      setShowFormReviewModal(true);
                    }}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                  >
                    🎥 Form AI
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setSets(item.sets);
                      setReps(item.reps || 10);
                      setWeightKg(item.weightKg || 60);
                      setDurationMinutes(
                        item.durationSeconds
                          ? Math.round(item.durationSeconds / 60)
                          : 0,
                      );
                      setNotes(item.notes || "");
                    }}
                    className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:border dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Log Exercise
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Search database or add custom exercise.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            {!selectedExercise ? (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exercises (e.g. Bench Press, Squat)..."
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    Exercise Database
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCreateExercise(!showCreateExercise)}
                    className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {showCreateExercise ? "Cancel" : "+ Create Custom Exercise"}
                  </button>
                </div>

                {showCreateExercise ? (
                  <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Exercise Name
                      </label>
                      <input
                        type="text"
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        placeholder="e.g. Overhead Cable Extension"
                        className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                          Category
                        </label>
                        <select
                          value={newExCategory}
                          onChange={(e) => setNewExCategory(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-zinc-200 px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          <option value="STRENGTH">Strength</option>
                          <option value="CARDIO">Cardio</option>
                          <option value="FLEXIBILITY">Flexibility</option>
                          <option value="BODYWEIGHT">Bodyweight</option>
                          <option value="CALISTHENICS">Calisthenics</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                          Muscle Group
                        </label>
                        <select
                          value={newExMuscleGroup}
                          onChange={(e) => setNewExMuscleGroup(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-zinc-200 px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          <option value="CHEST">Chest</option>
                          <option value="BACK">Back</option>
                          <option value="LEGS">Legs</option>
                          <option value="SHOULDERS">Shoulders</option>
                          <option value="ARMS">Arms</option>
                          <option value="CORE">Core</option>
                          <option value="FULL_BODY">Full Body</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateCustomExercise}
                      disabled={creatingEx || !newExName.trim()}
                      className="w-full rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      {creatingEx ? "Creating..." : "Save Exercise"}
                    </button>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5">
                    {exercises.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => setSelectedExercise(ex)}
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 p-3 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                      >
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {ex.name}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {ex.category} · {ex.muscleGroup}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          + Select
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedExercise.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {selectedExercise.category} ·{" "}
                        {selectedExercise.muscleGroup}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedExercise(null)}
                      className="text-xs font-semibold text-zinc-500 underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Sets
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={sets}
                      onChange={(e) => setSets(Number(e.target.value) || 1)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Reps
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Good form, focus on slow eccentric"
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddWorkoutItem}
                  disabled={loggingItem}
                  className="w-full rounded-xl bg-zinc-900 py-3 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {loggingItem ? "Logging..." : "Log to Workout"}
                </button>
              </div>
            )}

            {modalError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {modalError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:border dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Edit {editingItem.exercise.name}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Sets
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value) || 1)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Reps
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateWorkoutItem}
                  disabled={loggingItem}
                  className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {loggingItem ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete exercise log?"
          message={`Remove ${deleteTarget.exercise.name} from this workout?`}
          confirmLabel="Delete"
          destructive
          loading={deleting}
          error=""
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteItem}
        />
      )}

      {/* AI Form Review Modal */}
      {showFormReviewModal && (
        <AiFormReviewModal
          exerciseName={reviewExerciseName}
          onClose={() => setShowFormReviewModal(false)}
        />
      )}
    </div>
  );
}
