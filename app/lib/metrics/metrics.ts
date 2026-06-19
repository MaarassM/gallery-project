import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

export const registry = new Registry();
registry.setDefaultLabels({ app: "gallery" });

// 1. Request rate — total HTTP requests by method, path, status
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"],
  registers: [registry],
});

// 2. Request duration — response time histogram (ms)
export const httpRequestDurationMs = new Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "path"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [registry],
});

// 3. Memory + process metrics (GC, CPU, memory) — via collectDefaultMetrics
collectDefaultMetrics({ register: registry });

// 4. DB query duration — tracks Prisma query latency (wired in lib/db/client.ts)
export const dbQueryDurationMs = new Histogram({
  name: "db_query_duration_ms",
  help: "Prisma database query duration in milliseconds",
  labelNames: ["model", "operation"],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500],
  registers: [registry],
});

// 5. CUSTOM: Photos uploaded total — domain-specific, labeled by package type
export const photosUploadedTotal = new Counter({
  name: "photos_uploaded_total",
  help: "Total photos uploaded, segmented by user package type",
  labelNames: ["package_type"],
  registers: [registry],
});

// 6. CUSTOM: Active image processing operations — shows concurrency
export const activeImageProcessing = new Gauge({
  name: "active_image_processing",
  help: "Number of image processing operations currently in progress",
  registers: [registry],
});

// 7. CUSTOM: Total photos currently stored — refreshed from the DB on each
// scrape, so it always mirrors the real count in the UI and survives restarts.
export const photosInDb = new Gauge({
  name: "photos_in_db",
  help: "Current total number of photos stored in the database",
  registers: [registry],
});
