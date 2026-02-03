import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/lib/db/client";
import { createSession } from "~/lib/auth/simple-auth";
import { AuditService } from "~/modules/audit/services/audit-service";

export async function action({ request }: ActionFunctionArgs) {
  console.log("=== LOGIN ACTION ===");

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/auth?error=missing-fields" },
      });
    }

    // Find account with credential provider
    const account = await prisma.account.findFirst({
      where: {
        user: { email },
        providerId: "credential",
      },
      include: { user: true },
    });

    if (!account) {
      await AuditService.log({
        userEmail: email,
        userRole: "ANONYMOUS",
        action: "LOGIN_FAILED",
        resource: "Auth",
        success: false,
        errorMsg: "User not found",
      });

      return new Response(null, {
        status: 303,
        headers: { Location: "/auth?error=invalid-credentials" },
      });
    }

    // Verify password
    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(password, account.password || "");

    if (!isValid) {
      await AuditService.log({
        userEmail: email,
        userRole: "ANONYMOUS",
        action: "LOGIN_FAILED",
        resource: "Auth",
        success: false,
        errorMsg: "Invalid password",
      });

      return new Response(null, {
        status: 303,
        headers: { Location: "/auth?error=invalid-credentials" },
      });
    }

    // Create session
    const sessionToken = await createSession(account.user.id);

    await AuditService.log({
      userId: account.user.id,
      userEmail: account.user.email,
      userRole: account.user.role,
      action: "LOGIN",
      resource: "Auth",
      success: true,
    });

    console.log("Login successful, session created");

    // Set cookie and redirect
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie": `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
          7 * 24 * 60 * 60
        }`,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(null, {
      status: 303,
      headers: { Location: "/auth?error=server-error" },
    });
  }
}
