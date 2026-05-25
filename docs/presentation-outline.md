# Presentation Outline — AADBDT Gallery Project

Target grade: Preferred (~82 points across O1–O9)
Duration: ~20 minutes

---

## Slide 1 — Title

**AADBDT Photo Gallery**
TypeScript · React Router v7 · Prisma · PostgreSQL

*Mihael Maras — Advanced Application Design by Design Thinking*

---

## Slide 2 — Project Overview

**What is it?**
A full-stack photo gallery with user authentication, package-based upload limits, image processing (resize, filter, format conversion), and a Prometheus/Grafana observability stack.

**Tech stack at a glance:**
- React Router v7 (SSR) + Mantine v7 + TypeScript 5.7
- Prisma 6 + PostgreSQL 16
- prom-client + Prometheus + Grafana
- Docker (multi-stage build) + docker-compose
- Vitest 2 + Playwright + Vitest Bench

---

## Slide 3 — Git Flow (O1 — Version Control)

**Branching strategy — BRANCHING.md**

```
main ← develop ← feature/*
```

- `feature/*` branches per outcome/feature group
- Squash-free `--no-ff` merges to develop preserve history
- Conventional commit messages: `feat(scope): description`
- `main` receives only release merges from develop

**Show:** `git log --oneline --graph develop` — 12 feature branches, each with atomic commits

---

## Slide 4 — Functional Programming (O2) — Railway-Oriented Programming

**Result<T, E> — `app/lib/result.ts`**

```typescript
export type Result<T, E = Error> = Ok<T> | Err<E>;
export const Result = {
  ok: <T>(value: T): Ok<T> => ({ ok: true, value }),
  err: <E>(error: E): Err<E> => ({ ok: false, error }),
  map: (r, fn) => r.ok ? Result.ok(fn(r.value)) : r,
  flatMap: (r, fn) => r.ok ? fn(r.value) : r,
};
```

**Package limit checker — `app/modules/packages/utils/limit-checker.ts`**

```typescript
export function checkMonthlyPhotoLimit(pkg, usage): Result<void, string> {
  if (pkg.maxPhotosPerMonth === -1) return Result.ok(undefined);
  const uploaded = usage?.photosUploaded ?? 0;
  if (uploaded >= pkg.maxPhotosPerMonth)
    return Result.err(`Monthly limit reached (${pkg.maxPhotosPerMonth})`);
  return Result.ok(undefined);
}
```

No exceptions thrown — callers pattern-match on `.ok`.

---

## Slide 5 — Functional Programming (O2) — Higher-Order Functions & Composition

**Search criteria builder — `app/modules/photos/utils/search-criteria-builder.ts`**

```typescript
type WhereFilter = (w: Prisma.PhotoWhereInput) => Prisma.PhotoWhereInput;

export function withHashtagFilter(hashtags?: string[]): WhereFilter { ... }
export function withSizeFilter(min?: number, max?: number): WhereFilter { ... }

export function buildSearchWhere(criteria: SearchCriteria) {
  const filters = [
    withHashtagFilter(criteria.hashtags),
    withSizeFilter(criteria.minSize, criteria.maxSize),
    withDateFilter(criteria.dateFrom, criteria.dateTo),
    withAuthorFilter(criteria.authorId),
  ];
  return filters.reduce((where, filter) => filter(where), {});
}
```

Each filter is a pure function returning a new object — no mutation, composable via `Array.reduce`.

---

## Slide 6 — AOP Decorators (O3)

**4 decorators — `app/aspects/`**

| Decorator | Purpose | Applied On |
|---|---|---|
| `@Log(label)` | Logs entry + exit | `processUpload`, `processDownload`, `search` |
| `@Perf(thresholdMs)` | Logs execution time | `processUpload` (100ms), `processDownload` (50ms) |
| `@HandleErrors({silent})` | Catches and re-throws with logging | `AuditService.log` |
| `@Cache(ttlMs)` | In-memory TTL cache keyed by args | `PhotoRepository.search` (30s TTL) |

**How they work — method decorator pattern:**
```typescript
export function Log(label?: string): MethodDecorator {
  return (target, key, descriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (...args) {
      console.log(`[LOG] ▶ ${label}(...)`);
      const result = await original.apply(this, args);
      console.log(`[LOG] ✓ ${label} completed`);
      return result;
    };
  };
}
```

Requires `experimentalDecorators: true` in tsconfig — TypeScript legacy decorators, not the TC39 Stage 3 proposal.

---

## Slide 7 — Performance Benchmarks (O4)

**Vitest Bench — `benchmarks/`**

Two benchmark suites with 14 cases total:

```
benchmarks/hashtag-parser.bench.ts     — 6 cases
benchmarks/search-criteria.bench.ts    — 8 cases
```

**Selected results:**

| Benchmark | ops/sec |
|---|---|
| `parseHashtags` — empty | 26,529,323 |
| `parseHashtags` — 5 tags | 3,762,409 |
| `parseHashtags` — 20 tags | 395,663 |
| `buildSearchWhere` — no filters | 13,123,716 |
| `buildSearchWhere` — all filters | 3,129,164 |

**4 Documented Optimizations — `docs/optimizations.md`**

1. Metadata reuse in `processUpload` — avoids second `sharp()` decode
2. `@Cache(30_000)` on `PhotoRepository.search` — skips DB for repeated queries
3. Pure function composition — no mutable intermediate objects in `buildSearchWhere`
4. Single `Buffer.from()` call per upload — no redundant copies of multi-MB data

---

## Slide 8 — Testing Infrastructure (O5)

**Three test layers:**

| Layer | Tool | Location | Count |
|---|---|---|---|
| Unit | Vitest + happy-dom | `tests/unit/` | ~19 tests |
| Integration | Vitest + real PostgreSQL | `tests/integration/` | 7 tests |
| E2E | Playwright + Chromium | `tests/ui/` | 9 tests |

**Coverage config:** `@vitest/coverage-v8` — reports on `app/**/*.ts(x)` (excludes routes and root)

---

## Slide 9 — Unit Tests (O5)

**`tests/unit/images/pipeline-builder.test.ts`** — 6 tests
- Tests `ImagePipelineBuilder` fluent API: no-op pipeline, resize, filter, format, chaining

**`tests/unit/photos/hashtag-parser.test.ts`** — 8 tests
- Tests `parseHashtags`: undefined input, empty string, `#` prefix stripping, whitespace trimming, length limit (>50 chars), comma separation

**`tests/unit/photos/package-service.test.ts`** — 5 tests
- Tests `PackageService.checkUploadLimit` via `vi.mock("~/lib/db/client")` — mocks Prisma, verifies limit enforcement logic

---

## Slide 10 — Integration & E2E Tests (O5)

**`tests/integration/photo-repository.test.ts`** — 7 tests against real PostgreSQL
- `create`, `findById`, `findMany` (pagination), `search` (hashtag filter), `delete`, hashtag linkage

**Setup:** separate `gallery_test` DB, `TRUNCATE ... CASCADE` in `beforeEach`, real Prisma client

**`tests/ui/auth.spec.ts`** — 5 Playwright tests
- Both Login and Register tab panels render; form submission; error on wrong credentials
- Key technique: scope selectors to `form[action="/api/auth/login"]` because Mantine renders both panels in DOM simultaneously

**`tests/ui/home.spec.ts`** — 4 Playwright tests
- Unauthenticated redirect to `/auth`; header visible after login; logout flow

---

## Slide 11 — SOLID Principles (O6) — docs/SOLID.md

**S — SRP:** `PackageService` had 4 responsibilities. Limit logic extracted to pure functions in `limit-checker.ts`. Each function has one reason to change.

**O — OCP:** `SharpProcessor` had hardcoded `if/else` for filters. Now delegates to `filter-registry.ts` — new filters registered without modifying existing code.

**L — LSP:** `CloudStorageStrategy` threw `"Not implemented"` — violated the `StorageStrategy` contract. Fixed with safe stubs that match interface invariants.

**D — DIP:** `ImageProcessingService` hardcoded `new LocalStorageStrategy()`. Now injected via constructor — depends on the abstraction, not the implementation.

**I — ISP:** `StorageStrategy` defines exactly 4 methods (store, retrieve, delete, exists). No unrelated methods forced on implementors.

---

## Slide 12 — SOLID (O6) — Live Code Example: OCP

**Before** — adding a filter required modifying `SharpProcessor`:
```typescript
if (opts.filter === "sepia") pipeline.recomb([...]);
else if (opts.filter === "blur") pipeline.blur(3);
// adding "vignette" = edit this file
```

**After** — register a new filter without touching existing code:
```typescript
// filter-registry.ts
import { registerFilter } from "~/modules/images/filters/filter-registry";
registerFilter("vignette", (pipeline) =>
  pipeline.composite([{ input: ..., blend: "multiply" }])
);
```

SharpProcessor never changes — open for extension, closed for modification.

---

## Slide 13 — Design Patterns (O7)

**Strategy Pattern** — `StorageStrategy` interface
- `LocalStorageStrategy` — writes to `STORAGE_PATH` on disk
- `CloudStorageStrategy` — safe stub returning `cloud://...` paths (ready for real cloud)
- `ImageProcessingService` accepts either via DIP constructor injection

**Decorator Pattern** — AOP method decorators (`@Log`, `@Perf`, `@Cache`, `@HandleErrors`)
- Wraps async methods without modifying them
- Stacks: `@Log @Perf processUpload` — both active, both transparent to the method body

**Registry Pattern** — `filter-registry.ts`
- Open map: `name → SharpTransform`
- Supports runtime extension via `registerFilter(name, fn)`

**Repository Pattern** — `PhotoRepository`
- Abstracts all Prisma queries behind typed methods
- Integration tests target the repository, not raw Prisma — consistent test boundary

---

## Slide 14 — Docker & Deployment (O8)

**Multi-stage Dockerfile:**
```
FROM node:22-alpine AS deps    — pnpm install --frozen-lockfile
FROM node:22-alpine AS builder — prisma generate + react-router build
FROM node:22-alpine AS runner  — copy artifacts only, no dev deps
```

**docker-compose.yml — 4 services:**

| Service | Image | Port |
|---|---|---|
| `postgres` | postgres:16-alpine | 5434:5432 |
| `app` | local build | 3000:3000 |
| `prometheus` | prom/prometheus:latest | 9090:9090 |
| `grafana` | grafana/grafana:latest | 3001:3000 |

- `app` depends on `postgres` with `condition: service_healthy`
- `prometheus` scrapes `app:3000/api/metrics` every 10 seconds

---

## Slide 15 — Observability (O9)

**7 Prometheus metrics — `app/lib/metrics/metrics.ts`**

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `http_requests_total` | Counter | method, path, status | Request rate |
| `http_request_duration_ms` | Histogram | method, path | P50/P95/P99 latency |
| `http_errors_total` | Counter | method, path, error_type | Error rate |
| `process_cpu_*`, `nodejs_*` | Default | — | CPU/memory/GC (via collectDefaultMetrics) |
| `db_query_duration_ms` | Histogram | model, operation | Prisma latency |
| `photos_uploaded_total` | Counter | package_type | Domain metric |
| `active_image_processing` | Gauge | — | Concurrency |

**Endpoint:** `GET /api/metrics` — Prometheus text format
**Stack:** Prometheus scrapes → Grafana visualizes (dashboards importable from Grafana.com)

---

## Slide 16 — UI Design (Bonus)

**Dark glassmorphism theme:**
- Deep purple/indigo gradient background (`#0f0c29 → #302b63 → #24243e`)
- Ambient animated gradient orbs via CSS `::before` / `::after`
- Glass cards: `backdrop-filter: blur(20px)` + 5% white background
- Navigation: frosted glass header at 75% opacity

**Masonry photo grid:**
- CSS `column-count` masonry (4→3→2→1 columns)
- Photo cards with hover overlay (slide-up on `:hover`)
- Transition: `translateY(-4px) scale(1.01)` + purple glow shadow

**Auth page:**
- Centered glass card with camera icon + gradient brand text
- No full-page container — centered over the gradient

---

## Slide 17 — Summary & Demo

**Learning Outcomes achieved at Preferred tier:**

| O | Topic | Key deliverable |
|---|---|---|
| O1 | Version control | Git Flow, BRANCHING.md, conventional commits |
| O2 | Functional programming | Result<T,E>, HOFs, compose via reduce |
| O3 | AOP | 4 method decorators, experimentalDecorators |
| O4 | Performance | 14 benchmarks, 4 optimizations documented |
| O5 | Testing | Unit + Integration + E2E, 3 test layers |
| O6 | SOLID | All 5 principles, docs/SOLID.md with before/after |
| O7 | Design patterns | Strategy, Decorator, Registry, Repository |
| O8 | Docker | Multi-stage build, 4-service compose |
| O9 | Observability | 7 metrics (5 std + 2 custom), Prometheus + Grafana |

**Live demo:** `docker compose up` → browse photos → upload → `/api/metrics` → Prometheus target
