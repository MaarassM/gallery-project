import { publicProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { auth } from "~/lib/auth/config";
import { prisma } from "~/lib/db/client";
import { auditService } from "~/modules/audit/services/audit-service";
import type { PackageType } from "@prisma/client";

const registerSchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Password must be at least 8 characters"),
    v.regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
    v.regex(/[a-z]/, "Password must contain at least one lowercase letter"),
    v.regex(/[0-9]/, "Password must contain at least one number")
  ),
  name: v.optional(v.pipe(v.string(), v.minLength(2), v.maxLength(100))),
  packageType: v.optional(
    v.union([v.literal("FREE"), v.literal("PRO"), v.literal("GOLD")])
  ),
});

export const register = publicProcedure
  .input(registerSchema)
  .handler(async ({ input }) => {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Get package ID
      const packageType: PackageType = (input.packageType as PackageType) || "FREE";
      const packageRecord = await prisma.package.findUnique({
        where: { type: packageType },
      });

      if (!packageRecord) {
        throw new Error("Package not found");
      }

      const user = await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: "REGISTERED",
          packageType,
          packageId: packageRecord.id,
        },
      });

      await prisma.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: user.email,
        },
      });

      // Audit log
      await auditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: "USER_REGISTER",
        resource: "user",
        resourceId: user.id,
        metadata: {
          email: user.email,
          packageType,
        },
        success: true,
      });

      return {
        success: true,
        message: "Registration successful! Please log in.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          packageType: user.packageType,
        },
      };
    } catch (error) {
      // Audit log failure
      await auditService.log({
        userId: undefined,
        userEmail: input.email,
        userRole: "ANONYMOUS",
        action: "USER_REGISTER",
        resource: "user",
        metadata: {
          email: input.email,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
        errorMsg: error instanceof Error ? error.message : "Registration failed",
      });

      throw error;
    }
  });
