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

    const url = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const action = url.searchParams.get("action") || undefined;
    const userId = url.searchParams.get("userId") || undefined;
    const dateFrom = url.searchParams.get("dateFrom")
      ? new Date(url.searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = url.searchParams.get("dateTo")
      ? new Date(url.searchParams.get("dateTo")!)
      : undefined;

    // Build where clause
    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = dateFrom;
      if (dateTo) where.timestamp.lte = dateTo;
    }

    // Get audit logs
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
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
          timestamp: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return Response.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        user: log.user
          ? {
              id: log.user.id,
              name: log.user.name,
              email: log.user.email,
            }
          : null,
        userEmail: log.userEmail,
        userRole: log.userRole,
        timestamp: log.timestamp,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        success: log.success,
        errorMsg: log.errorMsg,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return Response.json(
      { error: "Failed to load audit logs" },
      { status: 500 }
    );
  }
}
