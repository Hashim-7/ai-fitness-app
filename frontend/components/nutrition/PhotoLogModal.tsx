"use client";

import React, { useState } from "react";
import { uploadPhotoToS3, analyseMealPhoto, type AiAnalysisResult, type AiFoodEstimate } from "../../lib/api";
import { mealLabel, mealOrder, formatWholeNumber } from "../../lib/nutrition/utils";
import type { Food, CreateFoodInput } from "../../lib/nutrition/types";

type PhotoLogModalProps = {
  selectedMeal: string;
  selectedDate: string;
  onMealChange: (meal: string) => void;
  onCreateAndAddFood: (input: CreateFoodInput, servings: number, mealType: string) => Promise<void>;
  onClose: () => void;
};

export function PhotoLogModal({
  selectedMeal,
  selectedDate,
  onMealChange,
  onCreateAndAddFood,
  onClose,
}: PhotoLogModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiAnalysisResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<boolean[]>([]);
  const [logging, setLogging] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setError("");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) {
      setFile(dropped);
      setPreviewUrl(URL.createObjectURL(dropped));
      setResult(null);
      setError("");
    }
  }

  async function handleAnalyze() {
    if (!file) return;

    try {
      setError("");
      setUploading(true);

      // 1. Presign & upload to AWS S3
      const key = await uploadPhotoToS3(file);
      setUploading(false);
      setAnalyzing(true);

      // 2. Call AI Service via backend analyse-photo endpoint
      const analysis = await analyseMealPhoto(key, selectedDate, selectedMeal);
      setResult(analysis);
      setSelectedItems(new Array(analysis.foods.length).fill(true));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze meal photo.");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }

  async function handleLogSelectedFoods() {
    if (!result || !result.foods || result.foods.length === 0) return;

    try {
      setLogging(true);
      setError("");

      const itemsToAdd = result.foods.filter((_, index) => selectedItems[index]);

      if (itemsToAdd.length === 0) {
        setError("Please select at least one food item to log.");
        return;
      }

      for (const item of itemsToAdd) {
        const createInput: CreateFoodInput = {
          name: item.name,
          servingSize: item.servingSize || 100,
          servingUnit: item.servingUnit || "g",
          calories: Math.round(item.calories),
          protein: Math.round(item.protein),
          carbs: Math.round(item.carbs),
          fat: Math.round(item.fat),
        };

        await onCreateAndAddFood(createInput, 1, selectedMeal);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log estimated foods.");
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:border dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                Gemini AI
              </span>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Log Meal via Photo
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Upload a photo of your food for instant AI calorie & macro estimation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {mealOrder.map((meal) => (
              <option key={meal} value={meal}>
                {mealLabel(meal)}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Zone */}
        {!result && (
          <div className="mt-5">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                previewUrl
                  ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20"
                  : "border-zinc-300 hover:border-indigo-400 dark:border-zinc-700"
              }`}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Meal preview"
                    className="max-h-56 rounded-xl object-cover shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Change photo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    📸
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Drag & drop your meal photo here
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">Supports JPG, PNG or WebP</p>
                  </div>
                  <label className="inline-block cursor-pointer rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                    Browse File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {file && !uploading && !analyzing && (
              <button
                type="button"
                onClick={handleAnalyze}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-95"
              >
                ✨ Estimate Calories & Macros with Gemini AI
              </button>
            )}

            {(uploading || analyzing) && (
              <div className="mt-5 flex flex-col items-center justify-center rounded-xl bg-indigo-50/50 p-6 text-center dark:bg-indigo-950/30">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="mt-3 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  {uploading ? "Uploading image to AWS S3..." : "Analyzing photo with Gemini AI..."}
                </p>
                <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                  Detecting food items, portion sizes, and nutritional composition...
                </p>
              </div>
            )}
          </div>
        )}

        {/* AI Results View */}
        {result && (
          <div className="mt-5 space-y-5">
            {/* Overview Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/40 dark:to-purple-950/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    AI Estimated Nutrition
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Found {result.foods.length} food item{result.foods.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                  }}
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Upload another
                </button>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-white/80 p-2 backdrop-blur-sm dark:bg-zinc-900/80">
                  <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {formatWholeNumber(result.total_calories)}
                  </span>
                  <span className="block text-[10px] text-zinc-400">kcal</span>
                </div>
                <div className="rounded-xl bg-white/80 p-2 backdrop-blur-sm dark:bg-zinc-900/80">
                  <span className="block text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {formatWholeNumber(result.total_protein)}g
                  </span>
                  <span className="block text-[10px] text-zinc-400">Protein</span>
                </div>
                <div className="rounded-xl bg-white/80 p-2 backdrop-blur-sm dark:bg-zinc-900/80">
                  <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatWholeNumber(result.total_carbs)}g
                  </span>
                  <span className="block text-[10px] text-zinc-400">Carbs</span>
                </div>
                <div className="rounded-xl bg-white/80 p-2 backdrop-blur-sm dark:bg-zinc-900/80">
                  <span className="block text-lg font-bold text-amber-600 dark:text-amber-400">
                    {formatWholeNumber(result.total_fat)}g
                  </span>
                  <span className="block text-[10px] text-zinc-400">Fat</span>
                </div>
              </div>
            </div>

            {/* List of Detected Foods */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Select items to log to {mealLabel(selectedMeal)}:
              </label>
              {result.foods.map((food, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const next = [...selectedItems];
                    next[idx] = !next[idx];
                    setSelectedItems(next);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                    selectedItems[idx]
                      ? "border-indigo-500 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-950/20"
                      : "border-zinc-200 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedItems[idx]}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {food.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        P {formatWholeNumber(food.protein)}g · C {formatWholeNumber(food.carbs)}g · F {formatWholeNumber(food.fat)}g
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatWholeNumber(food.calories)} kcal
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Action Button */}
            <button
              type="button"
              onClick={handleLogSelectedFoods}
              disabled={logging}
              className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {logging ? "Logging to diary..." : `Add selected foods to ${mealLabel(selectedMeal)}`}
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
