const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiError {
  message?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data: T | ApiError | null = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Something went wrong";

    throw new Error(errorMessage);
  }

  return data as T;
}

export async function uploadPhotoToS3(file: File): Promise<string> {
  const presignResult = await apiFetch<{ uploadUrl: string; key: string }>(
    "/uploads/presign",
    {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "image/jpeg",
      }),
    },
  );

  const uploadRes = await fetch(presignResult.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "image/jpeg",
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload image to storage");
  }

  return presignResult.key;
}

export interface AiFoodEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: number;
  servingUnit?: string;
}

export interface AiAnalysisResult {
  foods: AiFoodEstimate[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

export async function analyseMealPhoto(
  s3Key: string,
  date: string,
  mealType: string,
): Promise<AiAnalysisResult> {
  return apiFetch<AiAnalysisResult>("/diaries/analyse-photo", {
    method: "POST",
    body: JSON.stringify({
      s3Key,
      date,
      mealType,
    }),
  });
}

export async function uploadMediaToS3(file: File): Promise<string> {
  const presignResult = await apiFetch<{ uploadUrl: string; key: string }>(
    "/uploads/presign",
    {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    },
  );

  const uploadRes = await fetch(presignResult.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload media file to storage");
  }

  return presignResult.key;
}

export interface AiFormReviewResult {
  exercise_name: string;
  form_score: number;
  summary: string;
  posture_feedback: string[];
  positives: string[];
  improvements: string[];
  safety_warning?: string | null;
}

export async function analyseWorkoutForm(
  s3Key: string,
  exerciseName?: string,
): Promise<AiFormReviewResult> {
  return apiFetch<AiFormReviewResult>("/workouts/analyse-form", {
    method: "POST",
    body: JSON.stringify({
      s3Key,
      exerciseName,
    }),
  });
}

export const api = apiFetch;


