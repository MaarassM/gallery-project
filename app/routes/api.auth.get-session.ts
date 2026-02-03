import type { LoaderFunctionArgs } from "react-router";
import { auth } from "~/lib/auth/config";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("[Better-Auth] Handling get-session:", request.method);
  const response = await auth.handler(request);
  console.log("[Better-Auth] Session response status:", response.status);
  return response;
}
