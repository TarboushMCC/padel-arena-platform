"use client";

export async function adminRequest<TResponse>(
  url: string,
  init?: RequestInit
): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers
  });

  const payload = await response
    .json()
    .catch(() => ({ error: "Unexpected server response" })) as
    | TResponse
    | { error?: string };

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? (payload.error ?? "Request failed")
        : "Request failed";
    throw new Error(message);
  }

  return payload as TResponse;
}
