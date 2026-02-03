import { prisma } from "~/lib/db/client";
import crypto from "crypto";

/**
 * Simple session-based auth - NO external dependencies
 */

export async function createSession(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: {
      token: sessionToken,
      userId,
      expiresAt,
    },
  });

  return sessionToken;
}

export async function getSessionUser(sessionToken: string | null) {
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export async function deleteSession(sessionToken: string) {
  await prisma.session.delete({
    where: { token: sessionToken },
  });
}

export async function verifyPassword(email: string, password: string) {
  const account = await prisma.account.findFirst({
    where: {
      user: { email },
      providerId: "credential",
    },
    include: { user: true },
  });

  if (!account) return null;

  // Verify hashed password
  const bcrypt = await import("bcryptjs");
  const isValid = await bcrypt.compare(password, account.password || "");

  return isValid ? account.user : null;
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const [key, ...value] = cookie.trim().split("=");
      return [key, value.join("=")];
    })
  );
}
