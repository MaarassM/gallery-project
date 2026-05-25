import { PrismaClient } from "@prisma/client";

export const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

export async function cleanDatabase() {
  await testPrisma.$executeRaw`TRUNCATE audit_logs, usage_tracking, photo_hashtags, photos, hashtags, sessions, accounts, users, packages RESTART IDENTITY CASCADE`;
}

export async function seedTestUser() {
  return testPrisma.user.upsert({
    where: { email: "test@gallery.test" },
    update: {},
    create: {
      id: "test-user-id",
      email: "test@gallery.test",
      name: "Test User",
      role: "REGISTERED",
      packageType: "FREE",
    },
  });
}
