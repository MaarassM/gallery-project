import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { auth } from "~/lib/auth/config";
import { auditService } from "~/modules/audit/services/audit-service";

export async function action({ request }: ActionFunctionArgs) {
  console.log("[Better-Auth Handler] Handling action:", request.method, request.url);

  const url = new URL(request.url);
  const isSignIn = url.pathname.includes("/sign-in/email");

  // For sign-in, add audit logging
  if (isSignIn) {
    try {
      const body = await request.clone().json();
      const { email } = body;

      const response = await auth.handler(request);
      console.log("[Better-Auth Handler] Response status:", response.status);

      // Check if login was successful
      if (response.ok) {
        try {
          const data = await response.clone().json();
          if (data && data.user) {
            await auditService.log({
              userId: data.user.id,
              userEmail: data.user.email,
              userRole: data.user.role || "REGISTERED",
              action: "LOGIN",
              resource: "Auth",
              success: true,
            });
          }
        } catch (e) {
          console.error("[Better-Auth Handler] Error logging success:", e);
        }
      } else {
        await auditService.log({
          userEmail: email,
          userRole: "ANONYMOUS",
          action: "LOGIN_FAILED",
          resource: "Auth",
          success: false,
          errorMsg: "Invalid credentials",
        });
      }

      return response;
    } catch (error) {
      console.error("[Better-Auth Handler] Error:", error);
      return Response.json({ error: "Login failed" }, { status: 500 });
    }
  }

  // For other auth requests, just pass through
  const response = await auth.handler(request);
  console.log("[Better-Auth Handler] Response status:", response.status);
  return response;
}

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("[Better-Auth Handler] Handling loader:", request.method, request.url);
  const response = await auth.handler(request);
  console.log("[Better-Auth Handler] Response status:", response.status);
  return response;
}
