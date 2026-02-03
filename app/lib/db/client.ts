import { PrismaClient } from "@prisma/client";

// SINGLETON PATTERN: Osigurava da postoji samo jedna PrismaClient instanca u aplikaciji.
// Sprječava iscrpljivanje connection poola od višestrukih instanci.
// Globalni storage preživljava hot reloade u developmentu.

let prismaClient: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return prismaClient;
}

// U developmentu, spremi instancu globalno da preživi hot reloade
if (process.env.NODE_ENV !== "production") {
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };

  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = getPrismaClient();
  }

  prismaClient = globalWithPrisma.prisma;
}

export const prisma = getPrismaClient();
