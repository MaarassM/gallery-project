import type { ActionFunctionArgs } from "react-router";
import { deleteSession, getSessionUser, parseCookies } from "~/lib/auth/simple-auth";
import { auditService } from "~/modules/audit/services/audit-service";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies.session;

    const user = await getSessionUser(sessionToken);

    if (!user) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Log logout action
    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: (user as any).role || "REGISTERED",
      action: "LOGOUT",
      resource: "Auth",
      success: true,
    });

    // Delete session
    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    // Clear cookie and return success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
