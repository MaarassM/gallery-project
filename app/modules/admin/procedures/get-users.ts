import { adminProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { prisma } from "~/lib/db/client";

// Validation schema for getting users
const getUsersSchema = v.object({
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
  offset: v.optional(v.pipe(v.number(), v.minValue(0))),
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
});

export const getUsers = adminProcedure
  .input(getUsersSchema)
  .handler(async ({ input }) => {
    const where: any = {};

    if (input.role) {
      where.role = input.role;
    }

    if (input.packageType) {
      where.packageType = input.packageType;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: input.limit || 50,
        skip: input.offset || 0,
        orderBy: { createdAt: "desc" },
        include: {
          package: true,
          _count: {
            select: {
              photos: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        packageType: user.packageType,
        package: user.package
          ? {
              name: user.package.name,
              maxPhotosPerMonth: user.package.maxPhotosPerMonth,
              maxPhotoSizeMB: user.package.maxPhotoSizeMB,
              maxStorageGB: user.package.maxStorageGB,
            }
          : null,
        photoCount: user._count.photos,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      limit: input.limit || 50,
      offset: input.offset || 0,
    };
  });
