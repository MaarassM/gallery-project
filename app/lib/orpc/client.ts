import { ORPCClient } from "@orpc/client";
import type { AppRouter } from "./router";

/**
 * ORPC Client
 *
 * Type-safe client for making RPC calls to the server
 */

export const orpcClient = new ORPCClient<AppRouter>({
  baseURL: "/api/orpc",
  fetch: async (url, options) => {
    const response = await fetch(url, options);
    return response;
  },
});
