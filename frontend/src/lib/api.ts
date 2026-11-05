export type Agency = { id: string; name: string };

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: "owner" | "admin" | "member";
  agency: Agency;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Calls the FastAPI backend through the /api rewrite in next.config.ts.
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (response.status === 401 && path !== "/auth/login") {
    // This runs outside React, so there is no router to use here.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response));
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") return body.detail;
  } catch {
    // Not JSON, e.g. the backend isn't running.
  }
  return response.status >= 500
    ? "Couldn't reach the server. Try again in a moment."
    : "Something went wrong. Try again.";
}
