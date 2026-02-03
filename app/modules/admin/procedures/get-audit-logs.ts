import { adminProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { prisma } from "~/lib/db/client";

// Validation schema for getting audit logs
const getAuditLogsSchema = v.object({
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
  offset: v.optional(v.pipe(v.number(), v.minValue(0))),
  action: v.optional(v.string()),
  userId: v.optional(v.string()),
  success: v.optional(v.boolean()),
  dateFrom: v.optional(v.pipe(v.string(), v.isoDate())),
  dateTo: v.optional(v.pipe(v.string(), v.isoDate())),
});

export const getAuditLogs = adminProcedure
  .input(getAuditLogsSchema)
  .handler(async ({ input }) => {
    const where: any = {};

    if (input.action) {
      where.action = { contains: input.action };
    }

    if (input.userId) {
      where.userId = input.userId;
    }

    if (input.success !== undefined) {
      where.success = input.success;
    }

    if (input.dateFrom || input.dateTo) {
      where.timestamp = {};
      if (input.dateFrom) {
        where.timestamp.gte = new Date(input.dateFrom);
      }
      if (input.dateTo) {
        where.timestamp.lte = new Date(input.dateTo);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: input.limit || 50,
        skip: input.offset || 0,
        orderBy: { timestamp: "desc" },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        user: log.user
          ? {
              email: log.user.email,
              name: log.user.name,
            }
          : {
              email: log.userEmail,
              name: null,
            },
        userRole: log.userRole,
        metadata: log.metadata,
        success: log.success,
        errorMsg: log.errorMsg,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      })),
      total,
      limit: input.limit || 50,
      offset: input.offset || 0,
    };
  });
