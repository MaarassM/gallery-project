import { publicProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { auth } from "~/lib/auth/config";
import { auditService } from "~/modules/audit/services/audit-service";

const loginSchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
  password: v.pipe(v.string(), v.minLength(1, "Password is required")),
});

export const login = publicProcedure
  .input(loginSchema)
  .handler(async ({ input, context }) => {
    try {
      const session = await auth.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
        },
        headers: context.headers,
      });

      if (!session || !session.user) {
        throw new Error("Invalid email or password");
      }

      // Audit log
      await auditService.log({
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        action: "USER_LOGIN",
        resource: "user",
        resourceId: session.user.id,
        metadata: {
          email: session.user.email,
        },
        success: true,
      });

      return {
        success: true,
        message: "Login successful!",
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          packageType: session.user.packageType,
        },
        session: {
          token: session.session.token,
          expiresAt: session.session.expiresAt,
        },
      };
    } catch (error) {
      // Audit log failure
      await auditService.log({
        userId: undefined,
        userEmail: input.email,
        userRole: "ANONYMOUS",
        action: "USER_LOGIN",
        resource: "user",
        metadata: {
          email: input.email,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
        errorMsg: error instanceof Error ? error.message : "Login failed",
      });

      throw error;
    }
  });
