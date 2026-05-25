import { authedProcedure } from "~/lib/orpc/middleware";
import { auth } from "~/lib/auth/config";
import { auditService } from "~/modules/audit/services/audit-service";

export const logout = authedProcedure.handler(async ({ context }) => {
  const { user } = context;

  try {
    await auth.api.signOut({
      headers: context.headers,
    });

    // Audit log
    await auditService.log({
      userId: user.id,
      userEmail: user.email || undefined,
      userRole: user.role,
      action: "USER_LOGOUT",
      resource: "user",
      resourceId: user.id,
      metadata: {
        email: user.email,
      },
      success: true,
    });

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    // Audit log failure
    await auditService.log({
      userId: user.id,
      userEmail: user.email || undefined,
      userRole: user.role,
      action: "USER_LOGOUT",
      resource: "user",
      resourceId: user.id,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      success: false,
      errorMsg: error instanceof Error ? error.message : "Logout failed",
    });

    throw error;
  }
});
