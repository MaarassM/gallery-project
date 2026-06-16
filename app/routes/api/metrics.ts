import { registry, photosInDb } from "~/lib/metrics/metrics";
import { prisma } from "~/lib/db/client";

export async function loader() {
  // Refresh DB-backed gauges at scrape time so they reflect the live count.
  try {
    photosInDb.set(await prisma.photo.count());
  } catch {
    // If the DB is briefly unreachable, serve the rest of the metrics anyway.
  }

  const metrics = await registry.metrics();
  return new Response(metrics, {
    headers: {
      "Content-Type": registry.contentType,
      "Cache-Control": "no-cache",
    },
  });
}
