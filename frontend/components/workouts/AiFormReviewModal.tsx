"use client";

import React, { useState } from "react";
import { uploadMediaToS3, analyseWorkoutForm, type AiFormReviewResult } from "../../lib/api";

type AiFormReviewModalProps = {
  exerciseName?: string;
  onClose: () => void;
};

export function AiFormReviewModal({ exerciseName = "", onClose }: AiFormReviewModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetExercise, setTargetExercise] = useState(exerciseName);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiFormReviewResult | null>(null);

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
    if (dropped && (dropped.type.startsWith("video/") || dropped.name.match(/\.(mp4|mov|webm)$/i))) {
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

      // 1. Upload video to S3
      const key = await uploadMediaToS3(file);
      setUploading(false);
      setAnalyzing(true);

      // 2. Call AI Service via backend analyze-form endpoint
      const review = await analyseWorkoutForm(key, targetExercise.trim() || undefined);
      setResult(review);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze workout video form.");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:border dark:border-zinc-800 dark:bg-zinc-900">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                Gemini Vision AI
              </span>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                AI Exercise Form Review
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Upload a video of your set to receive posture breakdown, technique cues, and safety tips.
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

        {/* Target Exercise Input */}
        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Exercise Name (e.g. Barbell Squat, Conventional Deadlift)
          </label>
          <input
            type="text"
            value={targetExercise}
            onChange={(e) => setTargetExercise(e.target.value)}
            placeholder="Exercise being performed..."
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* Video Upload Dropzone */}
        {!result && (
          <div className="mt-5">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                previewUrl
                  ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                  : "border-zinc-300 hover:border-emerald-400 dark:border-zinc-700"
              }`}
            >
              {previewUrl ? (
                <div className="space-y-4 w-full max-w-md">
                  <video
                    src={previewUrl}
                    controls
                    className="max-h-60 w-full rounded-xl bg-black object-contain shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Select different video
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 text-2xl">
                    🎥
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Drag & drop your workout video here
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">Supports MP4, MOV, or WebM video files</p>
                  </div>
                  <label className="inline-block cursor-pointer rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                    Browse Video
                    <input
                      type="file"
                      accept="video/*"
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
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:opacity-95"
              >
                🎥 Analyze Exercise Form with Gemini AI
              </button>
            )}

            {(uploading || analyzing) && (
              <div className="mt-5 flex flex-col items-center justify-center rounded-xl bg-emerald-50/50 p-6 text-center dark:bg-emerald-950/30">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                <p className="mt-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  {uploading ? "Uploading video to storage..." : "Gemini AI is analyzing exercise mechanics..."}
                </p>
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Evaluating posture, knee tracking, spinal alignment, and tempo...
                </p>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Feedback View */}
        {result && (
          <div className="mt-5 space-y-5">
            {/* Form Score Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-5 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-900/50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {result.exercise_name || "Exercise Form Assessment"}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                    {result.summary}
                  </p>
                </div>

                <div className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white p-3 shadow-md dark:bg-zinc-900">
                  <div className="text-center">
                    <span className={`text-2xl font-black ${
                      result.form_score >= 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : result.form_score >= 60
                        ? "text-amber-500"
                        : "text-red-500"
                    }`}>
                      {result.form_score}
                    </span>
                    <span className="text-xs font-bold text-zinc-400"> / 100</span>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Form Score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Warning if present */}
            {result.safety_warning && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                <div className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400">
                  <span>⚠️ Injury Prevention Warning</span>
                </div>
                <p className="mt-1 opacity-90">{result.safety_warning}</p>
              </div>
            )}

            {/* What Went Well (Positives) */}
            {result.positives && result.positives.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <span>✅ Technique Strengths</span>
                </h4>
                <ul className="mt-2 space-y-1 text-xs text-emerald-900 dark:text-emerald-300">
                  {result.positives.map((pos, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span>•</span>
                      <span>{pos}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Posture & Alignment Cues */}
            {result.posture_feedback && result.posture_feedback.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>📍 Posture & Biomechanics Breakdown</span>
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  {result.posture_feedback.map((cue, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actionable Coaching Improvements */}
            {result.improvements && result.improvements.length > 0 && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
                <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                  <span>🚀 Actionable Coaching Tips for Next Set</span>
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-teal-900 dark:text-teal-300">
                  {result.improvements.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-teal-600 dark:text-teal-400">{idx + 1}.</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setFile(null);
                setPreviewUrl(null);
              }}
              className="w-full rounded-xl bg-zinc-900 py-3 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Analyze Another Video
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
