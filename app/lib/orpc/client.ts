import type { AppRouter } from "./router";

/**
 * ORPC Client
 *
 * Thin fetch-based client for calling server procedures exposed at
 * /api/orpc/*. Procedures are dispatched by dot-path (e.g. "photos.list"),
 * matching the navigation logic in the api.orpc.$ route handler.
 */

export type { AppRouter };

export const orpcClient = {
  baseURL: "/api/orpc",
  async call<TResult = unknown>(path: string, input?: unknown): Promise<TResult> {
    const response = await fetch(`/api/orpc/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
    });

    if (!response.ok) {
      throw new Error(`ORPC request failed: ${response.status}`);
    }

    return (await response.json()) as TResult;
  },
};
