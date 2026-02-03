import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth/config";

export async function action({ request }: ActionFunctionArgs) {
  console.log("[Better-Auth] Handling sign-in/email:", request.method);
  const response = await auth.handler(request);
  console.log("[Better-Auth] Response status:", response.status);
  return response;
}
