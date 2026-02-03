import type { User } from "~/lib/auth/config";

export type ORPCContext = {
  user: User | null;
  headers: Headers;
};
