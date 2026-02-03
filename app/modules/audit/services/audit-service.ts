import { prisma } from "~/lib/db/client";
import type { UserRole } from "@prisma/client";

// DECORATOR PATTERN: Dodaje logging ponašanje operacijama bez modificiranja njihovog koda.
// Poziva se nakon svake operacije (upload, download, login, itd.) da je "dekorira" s audit trailom.
// Korištenje: AuditService.log({...}) se poziva u procedurama da obavije operacije s loggingom.

export type AuditLogInput = {
  userId?: string;
  userEmail?: string;
  userRole: UserRole;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMsg?: string;
};

export class AuditService {
  static async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: input.userId,
          userEmail: input.userEmail,
          userRole: input.userRole,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          metadata: input.metadata as never,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          success: input.success ?? true,
          errorMsg: input.errorMsg,
        },
      });
    } catch (error) {
      // Ne failaj request ako audit logging ne uspije
      console.error("Failed to create audit log:", error);
    }
  }
}
