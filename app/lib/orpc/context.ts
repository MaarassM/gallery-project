import type { User } from "~/lib/auth/config";

export type ORPCContext = {
  user: User | null;
  headers: Headers;
};

/**
 * Builds the base request context. The authed/admin middlewares resolve the
 * actual session and populate `user`, so the base context starts with no user.
 */
export async function createORPCContext({
  headers,
}: {
  headers: Headers;
}): Promise<ORPCContext> {
  return {
    user: null,
    headers,
  };
}
