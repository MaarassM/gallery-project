import { registry } from "~/lib/metrics/metrics";

export async function loader() {
  const metrics = await registry.metrics();
  return new Response(metrics, {
    headers: {
      "Content-Type": registry.contentType,
      "Cache-Control": "no-cache",
    },
  });
}
