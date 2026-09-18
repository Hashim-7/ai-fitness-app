const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiError {
  message?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("is_authenticated") === "true" ? "authenticated" : null;
}

export function setToken(_token?: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("is_authenticated", "true");
    localStorage.removeItem("token"); // Purge sensitive raw JWT from localStorage
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("is_authenticated");
    localStorage.removeItem("token");
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Ignore error if network fails
  } finally {
    clearToken();
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // Automatically send & receive httpOnly session cookies
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
  const contentType = file.type || "video/mp4";

  const presignResult = await apiFetch<{ uploadUrl: string; key: string }>(
    "/uploads/presign",
    {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        contentType,
      }),
    },
  );

  const uploadRes = await fetch(presignResult.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
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


