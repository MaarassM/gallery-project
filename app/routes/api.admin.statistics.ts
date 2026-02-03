import type { LoaderFunctionArgs } from "react-router";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";
import { prisma } from "~/lib/db/client";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Check authentication and admin role
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies.session;
    const user = await getSessionUser(sessionToken);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((user as any).role !== "ADMINISTRATOR") {
      return Response.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get statistics
    const [totalUsers, totalPhotos, totalStorage, packageDistribution] =
      await Promise.all([
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

        // Package distribution
        prisma.user.groupBy({
          by: ["packageType"],
          _count: {
            packageType: true,
          },
        }),
      ]);

    // Get top uploaders (users with most photos)
    const topUploaders = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            photos: true,
          },
        },
        package: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        photos: {
          _count: "desc",
        },
      },
      take: 10,
    });

    // Get recent uploads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUploads = await prisma.photo.count({
      where: {
        uploadedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get most viewed photos
    const mostViewedPhotos = await prisma.photo.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
      orderBy: {
        viewCount: "desc",
      },
      take: 10,
    });

    // Get most downloaded photos
    const mostDownloadedPhotos = await prisma.photo.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        downloadCount: "desc",
      },
      take: 10,
    });

    // Calculate total views and downloads
    const [totalViews, totalDownloads] = await Promise.all([
      prisma.photo.aggregate({
        _sum: {
          viewCount: true,
        },
      }),
      prisma.photo.aggregate({
        _sum: {
          downloadCount: true,
        },
      }),
    ]);

    // Calculate storage display (show MB if less than 1 GB)
    const storageBytes = totalStorage._sum.sizeBytes || 0;
    const storageMB = storageBytes / 1024 / 1024;
    const storageGB = storageMB / 1024;
    const totalStorageDisplay = storageGB >= 1
      ? `${storageGB.toFixed(2)} GB`
      : `${storageMB.toFixed(2)} MB`;

    return Response.json({
      success: true,
      statistics: {
        overview: {
          totalUsers,
          totalPhotos,
          totalStorageBytes: storageBytes,
          totalStorageGB: storageGB.toFixed(2),
          totalStorageDisplay,
          recentUploads,
          totalViews: totalViews._sum.viewCount || 0,
          totalDownloads: totalDownloads._sum.downloadCount || 0,
        },
        packageDistribution: packageDistribution.map((p) => ({
          packageType: p.packageType,
          count: p._count.packageType,
        })),
        topUploaders: topUploaders.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          photoCount: u._count.photos,
          packageType: u.packageType,
          packageName: u.package?.name,
        })),
        mostViewedPhotos: mostViewedPhotos.map((p) => ({
          id: p.id,
          title: p.title,
          viewCount: p.viewCount,
          uploadedAt: p.uploadedAt,
          author: {
            id: p.user.id,
            name: p.user.name,
            email: p.user.email,
          },
          hashtags: p.hashtags.map((h) => h.hashtag.name),
        })),
        mostDownloadedPhotos: mostDownloadedPhotos.map((p) => ({
          id: p.id,
          title: p.title,
          downloadCount: p.downloadCount,
          uploadedAt: p.uploadedAt,
          author: {
            id: p.user.id,
            name: p.user.name,
            email: p.user.email,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Get statistics error:", error);
    return Response.json(
      { error: "Failed to load statistics" },
      { status: 500 }
    );
  }
}
