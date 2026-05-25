import { adminProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { prisma } from "~/lib/db/client";
import { auditService } from "~/modules/audit/services/audit-service";
import type { UserRole, PackageType } from "@prisma/client";

// Validation schema for updating user
const updateUserSchema = v.object({
  userId: v.pipe(v.string(), v.minLength(1)),
  data: v.object({
    name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
    role: v.optional(
      v.union([
        v.literal("ANONYMOUS"),
        v.literal("REGISTERED"),
        v.literal("ADMINISTRATOR"),
      ])
    ),
    packageType: v.optional(
      v.union([v.literal("FREE"), v.literal("PRO"), v.literal("GOLD")])
    ),
  }),
});

export const updateUser = adminProcedure
  .input(updateUserSchema)
  .handler(async ({ input, context }) => {
    const { user: admin } = context;

    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Prepare update data
      const updateData: any = {};

      if (input.data.name !== undefined) {
        updateData.name = input.data.name;
      }

      if (input.data.role !== undefined) {
        updateData.role = input.data.role as UserRole;
      }

      if (input.data.packageType !== undefined) {
        const packageRecord = await prisma.package.findUnique({
          where: { type: input.data.packageType as PackageType },
        });

        if (!packageRecord) {
          throw new Error("Package not found");
        }

        updateData.packageType = input.data.packageType;
        updateData.packageId = packageRecord.id;
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: input.userId },
        data: updateData,
        include: {
          package: true,
        },
      });

      // Audit log
      await auditService.log({
        userId: admin.id,
        userEmail: admin.email || undefined,
        userRole: admin.role,
        action: "ADMIN_UPDATE_USER",
        resource: "user",
        resourceId: updatedUser.id,
        metadata: {
          targetUserId: updatedUser.id,
          targetUserEmail: updatedUser.email,
          changes: input.data,
        },
        success: true,
      });

      return {
        success: true,
        message: "User updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          packageType: updatedUser.packageType,
          package: updatedUser.package,
        },
      };
    } catch (error) {
      // Audit log failure
      await auditService.log({
        userId: admin.id,
        userEmail: admin.email || undefined,
        userRole: admin.role,
        action: "ADMIN_UPDATE_USER",
        resource: "user",
        resourceId: input.userId,
        metadata: {
          targetUserId: input.userId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
        errorMsg: error instanceof Error ? error.message : "Update failed",
      });

      throw error;
    }
  });
