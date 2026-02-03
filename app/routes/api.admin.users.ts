import type { LoaderFunctionArgs } from "react-router";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";
import { prisma } from "~/lib/db/client";
import { UserRole } from "@prisma/client";

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

    if ((user as any).role !== UserRole.ADMINISTRATOR) {
      return Response.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get all users with their packages
    const users = await prisma.user.findMany({
      include: {
        package: true,
        photos: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        packageType: u.packageType,
        package: u.package
          ? {
              name: u.package.name,
              type: u.package.type,
              maxPhotosPerMonth: u.package.maxPhotosPerMonth,
              maxPhotoSizeMB: u.package.maxPhotoSizeMB,
              maxStorageGB: u.package.maxStorageGB,
            }
          : null,
        photoCount: u._count.photos,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      total: users.length,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return Response.json({ error: "Failed to load users" }, { status: 500 });
  }
}
