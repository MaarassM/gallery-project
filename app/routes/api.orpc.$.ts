import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { appRouter } from "~/lib/orpc/router";
import { createORPCContext } from "~/lib/orpc/context";
import { httpRequestsTotal, httpRequestDurationMs } from "~/lib/metrics/metrics";

/**
 * ORPC API Route Handler
 *
 * Handles all ORPC requests at /api/orpc/*
 *
 * OBSERVABILITY (O9): every API call is timed and counted, so the
 * `http_requests_total` and `http_request_duration_ms` metrics stay live.
 */

export async function action({ request }: ActionFunctionArgs) {
  const start = performance.now();
  const method = request.method;
  const path = new URL(request.url).pathname.replace("/api/orpc/", "");
  let status = "200";

  try {
    const context = await createORPCContext({ headers: request.headers });

    // Parse request body
    const body = await request.json();

    // Navigate to the procedure based on the path
    const parts = path.split(".");
    let procedure: any = appRouter;
    for (const part of parts) {
      procedure = procedure[part];
    }

    // Execute the procedure
    const result = await procedure(body, context);

    return Response.json(result);
  } catch (error) {
    status = "500";
    throw error;
  } finally {
    httpRequestDurationMs.observe({ method, path }, performance.now() - start);
    httpRequestsTotal.inc({ method, path, status });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  return action({ request, params: {}, context: {} } as ActionFunctionArgs);
}
