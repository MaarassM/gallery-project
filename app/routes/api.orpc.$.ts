import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { appRouter } from "~/lib/orpc/router";
import { createORPCContext } from "~/lib/orpc/context";

/**
 * ORPC API Route Handler
 *
 * Handles all ORPC requests at /api/orpc/*
 */

export async function action({ request }: ActionFunctionArgs) {
  const context = await createORPCContext({ headers: request.headers });

  // Parse request body
  const body = await request.json();

  // Call the appropriate procedure based on the path
  const path = new URL(request.url).pathname.replace('/api/orpc/', '');
  const parts = path.split('.');

  // Navigate to the procedure
  let procedure: any = appRouter;
  for (const part of parts) {
    procedure = procedure[part];
  }

  // Execute the procedure
  const result = await procedure(body, context);

  return Response.json(result);
}

export async function loader({ request }: LoaderFunctionArgs) {
  return action({ request, params: {}, context: {} } as ActionFunctionArgs);
}
