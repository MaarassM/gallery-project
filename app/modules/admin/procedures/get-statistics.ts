import { adminProcedure } from "~/lib/orpc/middleware";
import { prisma } from "~/lib/db/client";

export const getStatistics = adminProcedure.handler(async () => {
  // Get all statistics in parallel
  const [
    totalUsers,
    totalPhotos,
    totalStorage,
    usersByPackage,
    usersByRole,
    recentUploads,
    topUploaders,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Total photos
    prisma.photo.count(),

    // Total storage used (sum of all photo sizes)
    prisma.photo.aggregate({
      _sum: {
        sizeBytes: true,
      },
    }),

    // Users by package type
    prisma.user.groupBy({
      by: ["packageType"],
      _count: true,
    }),

    // Users by role
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),

    // Recent uploads (last 7 days)
    prisma.photo.count({
      where: {
        uploadedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Top uploaders (users with most photos)
    prisma.user.findMany({
      take: 5,
      orderBy: {
        photos: {
          _count: "desc",
        },
      },
      include: {
        _count: {
          select: {
            photos: true,
          },
        },
      },
    }),
  ]);

  return {
    success: true,
    statistics: {
      overview: {
        totalUsers,
        totalPhotos,
        totalStorageGB: ((totalStorage._sum.sizeBytes || 0) / 1024 / 1024 / 1024).toFixed(2),
        recentUploads7Days: recentUploads,
      },
      usersByPackage: usersByPackage.map((pkg) => ({
        packageType: pkg.packageType,
        count: pkg._count,
      })),
      usersByRole: usersByRole.map((role) => ({
        role: role.role,
        count: role._count,
      })),
      topUploaders: topUploaders.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        photoCount: user._count.photos,
      })),
    },
  };
});
