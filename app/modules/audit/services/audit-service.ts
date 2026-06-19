import { prisma } from "~/lib/db/client";
import type { UserRole } from "@prisma/client";
import { HandleErrors } from "~/aspects";

// DECORATOR PATTERN: Adds logging behaviour to operations without modifying their code.
// AOP: @HandleErrors replaces the manual try/catch — the aspect absorbs the cross-cutting concern.

export type AuditLogInput = {
  userId?: string;
  userEmail?: string;
  // Accept the loose role shape coming from the auth session (string | null |
  // undefined) and normalize to a valid UserRole before persisting.
  userRole: UserRole | string | null | undefined;
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
  @HandleErrors({ silent: true })
  async log(input: AuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userEmail: input.userEmail,
        userRole: (input.userRole ?? "ANONYMOUS") as UserRole,
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
  }
}

export const auditService = new AuditService();
