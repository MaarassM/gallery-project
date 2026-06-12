# Learning Outcomes — Walkthrough of Changes

What was added to the Gallery project for each outcome of the APP assignment, and why. All items target the **Preferred** tier.

## O1 — Describe programming testing concepts (8 pts)

- **Added:** Slides 8–10 in `docs/presentation-outline.md` (+ `docs/Gallery-Defense.pptx`) covering the test pyramid, mocking vs. real I/O, and AAA structure, with examples from this codebase.
- **Why:** The spec requires advanced testing concepts described *as part of the presentation*, illustrated on the solution itself.

## O2 + O3 — Unit, integration, UI tests (8 + 8 pts)

- **Added:** 36 tests across all three categories:
  - **Unit (20):** `tests/unit/` — hashtag parser, search-criteria builder, package limit checker, image pipeline builder. Pure logic, no I/O.
  - **Integration (7):** `tests/integration/photo-repository.test.ts` — repository against a real PostgreSQL test database (`.env.test`, port 5434).
  - **UI/E2E (9):** `tests/ui/auth.spec.ts` + `home.spec.ts` — Playwright drives the real browser against the running app.
- **Why:** Preferred tier needs all 3 categories, ≥10 tests, on ≥2 architecturally different parts — covered here by utils/services (unit), data layer (integration), and routes/UI (E2E).

## O4 — Testing and improving the solution (8 pts)

- **Added:** `docs/optimizations.md` — 4 before/after optimizations (Sharp metadata reuse, `@Cache` on photo search, pure where-clause composition, single buffer conversion per upload) and `benchmarks/` — 2 Vitest bench suites (`pnpm bench`) measuring hashtag parsing and search-criteria building.
- **Why:** Preferred tier asks for concrete reductions in **time spent and allocated memory**, proven by benchmarks rather than claimed.

## O5 — Reduce coupling with functional programming (10 pts)

- **Added:** 5 different methods refactored to FP:
  1. `app/lib/result.ts` — `Result<T, E>` type with `map`/`flatMap` (Railway-Oriented Programming).
  2. `app/modules/packages/utils/limit-checker.ts` — limit checks return `Ok/Err` instead of throwing.
  3. `app/modules/photos/utils/search-criteria-builder.ts` — pure filter functions composed via `reduce` (replaced a 30-line mutating if/else chain).
  4. `app/modules/photos/utils/photo-mappers.ts` — pure DTO mapper, deduplicating identical mapping code in routes.
  5. `app/modules/photos/utils/hashtag-parser.ts` — pure `split → map → filter` pipeline (was inline, untestable).
- **Why:** Pure functions with explicit inputs/outputs decouple logic from Prisma/HTTP, making it independently testable (these are exactly the units covered in O2).

## O6 — Aspect-oriented programming (10 pts)

- **Added:** 4 TypeScript decorators in `app/aspects/` with 8 usages:
  - `@Log` — method entry/exit logging (`ImageProcessingService.processUpload`/`processDownload`, `PhotoRepository.search`).
  - `@Perf(thresholdMs)` — execution-time warnings (both image-processing methods).
  - `@Cache(ttlMs)` — memoizes `PhotoRepository.search` for 30 s.
  - `@HandleErrors` — absorbs/logs failures in `AuditService.log` so audit errors never break a request.
- **Why:** Preferred tier needs ≥2 aspects with ≥5 usages; decorators centralize cross-cutting concerns previously copy-pasted into each method.

## O7 — Version control workflow (10 pts)

- **Added:** `BRANCHING.md` (Git Flow strategy description) and 7 branches: `main`, `develop`, `feature/testing-infrastructure`, `feature/aop-decorators`, `feature/functional-refactoring`, `feature/solid-docker`, `chore/spec-cleanup` — each feature developed on its own branch and merged into `develop`.
- **Why:** Preferred tier requires ≥2 branches plus a documented source-code-management strategy.

## O8 — Refactoring with SOLID (6 pts) + Docker (4 pts)

- **Added:** `docs/SOLID.md` with before/after code for all 5 principles:
  - **SRP** — `PackageService` split (limit checking extracted to `limit-checker.ts`).
  - **OCP** — `filter-registry.ts`: new image filters register without modifying the pipeline.
  - **LSP** — `CloudStorageStrategy` made contract-compliant (was throwing "Not implemented").
  - **ISP/DIP** — `StorageStrategy` / `ImageProcessor` interfaces; `ImageProcessingService` gets storage injected instead of hardcoding `LocalStorageStrategy`.
- **Added:** `Dockerfile` (app image) + `docker-compose.yml` (app + PostgreSQL + Prometheus) — `pnpm docker:up` runs the whole stack.
- **Why:** Preferred tier asks for ≥4 SOLID principles demonstrated and the app containerized with Docker.

## O9 — Metrics and monitoring (10 pts)

- **Added:** `app/lib/metrics/metrics.ts` (prom-client) exposing 7 metrics at `/api/metrics`, scraped by Prometheus (`monitoring/prometheus.yml`): HTTP request count, request duration histogram, error count, Node.js process/memory/GC defaults, DB query duration — plus 2 **custom domain metrics**: `photos_uploaded_total` (by package type) and `active_image_processing` (concurrency gauge).
- **Why:** Preferred tier requires ≥5 metrics with at least one self-created; the custom ones track health of the app's core feature (uploads), not just generic infrastructure.
