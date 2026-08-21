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

export const api = apiFetch;
