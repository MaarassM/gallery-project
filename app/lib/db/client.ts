import { PrismaClient } from "@prisma/client";
import { dbQueryDurationMs } from "~/lib/metrics/metrics";

// SINGLETON PATTERN: Osigurava da postoji samo jedna PrismaClient instanca u aplikaciji.
// Sprječava iscrpljivanje connection poola od višestrukih instanci.
// Globalni storage preživljava hot reloade u developmentu.
//
// OBSERVABILITY (O9): the client is extended with a query timer so every model
// operation records its latency into the `db_query_duration_ms` histogram.

// Extends a base client with per-query latency instrumentation.
function withMetrics(client: PrismaClient) {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now();
          try {
            return await query(args);
          } finally {
            dbQueryDurationMs.observe(
              { model: model ?? "unknown", operation },
              performance.now() - start,
            );
          }
        },
      },
    },
  });
}

export type DbClient = ReturnType<typeof withMetrics>;

let prismaClient: DbClient | undefined;

export function getPrismaClient(): DbClient {
  if (!prismaClient) {
    prismaClient = withMetrics(
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }),
    );
  }
  return prismaClient;
}

// U developmentu, spremi instancu globalno da preživi hot reloade
if (process.env.NODE_ENV !== "production") {
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: DbClient;
  };

  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = getPrismaClient();
  }

  prismaClient = globalWithPrisma.prisma;
}

export const prisma = getPrismaClient();
