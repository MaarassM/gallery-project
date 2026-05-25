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

// 3. Error rate — errors by type
export const httpErrorsTotal = new Counter({
  name: "http_errors_total",
  help: "Total HTTP error responses",
  labelNames: ["method", "path", "error_type"],
  registers: [registry],
});

// 4. Memory + process metrics (GC, CPU, memory) — via collectDefaultMetrics
collectDefaultMetrics({ register: registry });

// 5. DB query duration — tracks Prisma query latency
export const dbQueryDurationMs = new Histogram({
  name: "db_query_duration_ms",
  help: "Prisma database query duration in milliseconds",
  labelNames: ["model", "operation"],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500],
  registers: [registry],
});

// 6. CUSTOM: Photos uploaded total — domain-specific, labeled by package type
export const photosUploadedTotal = new Counter({
  name: "photos_uploaded_total",
  help: "Total photos uploaded, segmented by user package type",
  labelNames: ["package_type"],
  registers: [registry],
});

// 7. CUSTOM: Active image processing operations — shows concurrency
export const activeImageProcessing = new Gauge({
  name: "active_image_processing",
  help: "Number of image processing operations currently in progress",
  registers: [registry],
});
