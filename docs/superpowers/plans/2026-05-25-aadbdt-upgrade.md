# AADBDT Gallery — Upgrade Plan (Preferred Tier, ~82 pts)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Photo Gallery project to the "Preferred" tier across all AADBDT learning outcomes by adding tests, AOP decorators, functional refactoring, SOLID improvements, containerization, metrics, monitoring, and a redesigned UI — with zero rewrites, only surgical additions.

**Architecture:** React Router v7 (SSR) full-stack app. Server-side logic lives in oRPC procedures; data access is in `PhotoRepository`; image processing is in `ImageProcessingService` with a Builder/Strategy/Factory pattern already in place. All new cross-cutting concerns go into `app/lib/` or `app/aspects/`.

**Tech Stack:** TypeScript 5.7, React 18 + React Router 7, Prisma 6 + PostgreSQL, Mantine 7, oRPC, Valibot, Sharp, Vitest, Playwright, prom-client, TypeScript legacy decorators (already enabled in tsconfig).

---

## ⚡ Current State Report

### What Exists

| Area | Status |
|------|--------|
| Photo CRUD, upload, search, download | ✅ Complete |
| Auth (email + OAuth) via Better-Auth | ✅ Complete |
| Image processing pipeline (Builder/Factory/Strategy) | ✅ Complete |
| Audit logging (Decorator pattern) | ✅ Complete |
| Admin dashboard (users, stats, audit logs) | ✅ Complete |
| Subscription packages / usage tracking | ✅ Complete |
| Prisma schema + migrations + seed | ✅ Complete |
| Docker Compose (Postgres only) | ✅ Partial |
| Vitest configured | ✅ Configured |
| Tests | ❌ Zero test files |
| App Dockerfile | ❌ Missing |
| Git branches | ❌ Only `main` |
| BRANCHING.md | ❌ Missing |
| AOP decorators | ❌ Missing |
| Metrics / monitoring | ❌ Missing |
| Functional-style refactoring | ❌ Not started |
| SOLID before/after documentation | ❌ Not started |
| Performance benchmarks | ❌ Missing |
| CI/CD pipeline | ❌ Missing |
| UI redesign | ❌ Default Mantine styling |

### Architectural Pain Points

1. **`PhotoRepository` static/instance mismatch** — `upload-photo.ts:84` calls `PhotoRepository.create()` as a static method, but `PhotoRepository` only has instance methods. `search-photos.ts:17` correctly instantiates `new PhotoRepository()`. This is a silent runtime bug; fix during SOLID phase.

2. **`ImageProcessingService` violates DIP** — `private static storage = new LocalStorageStrategy()` is hardcoded on line 27. The class cannot swap storage backends without editing the source. Fix: inject `StorageStrategy` via constructor parameter (DIP example).

3. **`PackageService` violates SRP** — it handles limit checking, storage tracking, download permissions, and filter permissions all in one class. Good SRP refactoring candidate.

4. **`uploadPhoto` procedure is a 100+ line god handler** — limit checking → file validation → buffer conversion → image processing → hashtag parsing → DB write → usage tracking → audit. Each step is an imperative sequence with no error short-circuiting. Good candidate for Railway-Oriented Programming.

5. **AOP cross-cutting concerns are manual** — performance timing, exception catching, and audit logging are copy-pasted into each procedure. Decorators will centralize this.

6. **Hashtag parsing is inline, untested** — the 5-line transform in `upload-photo.ts:76-82` has edge cases (empty strings, whitespace-only tags) that can only be caught with unit tests.

### AOP Hotspots (5 immediate usages)

| Method | Aspects |
|--------|---------|
| `ImageProcessingService.processUpload` | `@Log`, `@Perf` |
| `ImageProcessingService.processDownload` | `@Log`, `@Perf` |
| `PhotoRepository.search` | `@Log`, `@Cache(60_000)` |
| `PackageService.checkUploadLimit` | `@HandleErrors` |
| `AuditService.log` | `@HandleErrors` |

---

## 🚦 Recommended Execution Order

```
Phase 0  → Phase 1 → Phase 2 → Phase 3 → Phase 4
                                    ↓
Phase 5 (AOP) → Phase 6 (FP) → Phase 7 (SOLID) → Phase 8 (Docker)
                                    ↓
Phase 9 (Metrics) → Phase 10 (Benchmarks) → Phase 11 (UI) → Phase 12 (Presentation)
```

**Rationale:** Branch setup first (O7 unblocks everything). Tests second (Phase 2-4) so they catch regressions from later refactoring. AOP/FP/SOLID are independent of each other but depend on tests existing. Metrics and Docker last (infrastructure). UI last (cosmetic). Presentation slides written after all code exists.

---

## Phase 0 — Git Branching Strategy (O7)

**Goal:** Satisfy the ≥2 branches + documented strategy requirement.  
**Effort:** S (30 min)  
**Outcome:** O7

### Task 0.1 — Create develop branch and write BRANCHING.md

**Files:**
- Create: `BRANCHING.md`

- [ ] Create `develop` branch from `main`:

```bash
git checkout -b develop
git push -u origin develop
```

- [ ] Create `BRANCHING.md` at repo root:

```markdown
# Branching Strategy

This project uses a simplified **Git Flow** strategy.

## Branch Types

| Branch | Purpose | Merges into |
|--------|---------|------------|
| `main` | Production-ready, tagged releases | — |
| `develop` | Integration branch, always deployable | `main` via PR |
| `feature/*` | Individual features and fixes | `develop` via PR |
| `hotfix/*` | Urgent production patches | `main` AND `develop` |

## Workflow

1. Branch from `develop`: `git checkout -b feature/my-feature develop`
2. Commit often with descriptive messages: `feat: add photo download metrics`
3. Open a PR targeting `develop`. Require at least one review.
4. Merge via **Squash and Merge** to keep `develop` history clean.
5. When `develop` is stable and tested, open a PR from `develop` → `main`.
6. Tag `main` releases: `git tag -a v1.1.0 -m "Release v1.1.0"`

## Commit Message Convention

Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `perf`

Examples:
- `feat(photos): add AOP logging decorator`
- `test(repository): add unit tests for PhotoRepository`
- `refactor(upload): extract hashtag parsing to pure function`

## Branch Protection Rules (GitHub)

- `main`: Require PR + passing CI before merge. No direct push.
- `develop`: Require PR. Direct push allowed for repo admin only.
```

- [ ] Commit:

```bash
git add BRANCHING.md
git commit -m "docs: add Git Flow branching strategy documentation"
git push
```

- [ ] Create feature branch for the first implementation phase:

```bash
git checkout -b feature/testing-infrastructure
```

**Acceptance Criteria:** `git branch -a` shows `main`, `develop`, and at least one `feature/*` branch. `BRANCHING.md` exists at repo root.

---

## Phase 1 — Testing Infrastructure (O2 + O3)

**Goal:** Wire up Vitest for unit + integration tests and Playwright for UI tests. Add one smoke test to prove the setup works.  
**Effort:** S (1 hour)  
**Outcome:** O2, O3

### Task 1.1 — Install test dependencies

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts` (update existing)
- Create: `playwright.config.ts`

- [ ] Install packages:

```bash
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  happy-dom @vitest/coverage-v8 vitest-mock-extended \
  @playwright/test
```

- [ ] Update `vite.config.ts` (or create `vitest.config.ts`) to add test config:

```typescript
// vitest.config.ts  (create new file alongside vite.config.ts)
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["app/**/*.ts", "app/**/*.tsx"],
      exclude: ["app/routes/**", "app/root.tsx"],
    },
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
  },
});
```

- [ ] Create `tests/setup.ts`:

```typescript
import "@testing-library/jest-dom";
import { vi } from "vitest";
// Reset all mocks between tests
afterEach(() => vi.clearAllMocks());
```

- [ ] Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

- [ ] Add scripts to `package.json`:

```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage",
"test:ui": "playwright test",
"test:ui:headed": "playwright test --headed"
```

- [ ] Install Playwright browsers:

```bash
pnpm exec playwright install chromium
```

- [ ] Create test directory structure:

```bash
mkdir -p tests/unit/images tests/unit/photos tests/integration tests/ui
```

- [ ] Create a smoke test to verify setup works (`tests/unit/smoke.test.ts`):

```typescript
// Verifies vitest environment is wired correctly
describe("test setup", () => {
  it("runs a passing test", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] Run and verify:

```bash
pnpm test:run
# Expected: 1 test suite, 1 passed
```

- [ ] Commit:

```bash
git add -A
git commit -m "test: configure vitest and playwright test infrastructure"
```

**Acceptance Criteria:** `pnpm test:run` passes. `pnpm exec playwright test --list` lists tests.

---

## Phase 2 — Unit Tests (O2)

**Goal:** ≥5 unit tests covering `ImagePipelineBuilder`, hashtag parsing, and `PackageService` limit logic.  
**Effort:** M (2-3 hours)  
**Outcome:** O2, O3

### Task 2.1 — Unit test: ImagePipelineBuilder (pure logic)

**Files:**
- Create: `tests/unit/images/pipeline-builder.test.ts`

```
// Compare with: tests/unit/images/pipeline-builder.test.ts
// Approach: Pure unit test — no I/O, tests only the builder's state accumulation.
// Reference pattern: AAA (Arrange-Act-Assert), no mocks needed because
// ImagePipelineBuilder has no external dependencies.
```

- [ ] Create `tests/unit/images/pipeline-builder.test.ts`:

```typescript
// Unit test for ImagePipelineBuilder — pure builder state, no I/O.
// AAA pattern: Arrange (new builder), Act (chain methods), Assert (getOptions).
// Compare: Spring unit testing uses @SpringBootTest; here no DI container needed.
import { describe, it, expect } from "vitest";
import { ImagePipelineBuilder } from "~/modules/images/pipelines/pipeline-builder";

describe("ImagePipelineBuilder", () => {
  it("builds a pipeline with no options when nothing is chained", () => {
    const pipeline = new ImagePipelineBuilder().build();
    expect(pipeline.getOptions()).toEqual({});
  });

  it("sets resize options correctly via withResize()", () => {
    const pipeline = new ImagePipelineBuilder()
      .withResize(800, 600, "cover")
      .build();

    expect(pipeline.getOptions().resize).toEqual({
      width: 800,
      height: 600,
      fit: "cover",
    });
  });

  it("sets filter via withFilter()", () => {
    const pipeline = new ImagePipelineBuilder().withFilter("sepia").build();
    expect(pipeline.getOptions().filter).toBe("sepia");
  });

  it("sets format and quality via withFormat()", () => {
    const pipeline = new ImagePipelineBuilder().withFormat("png", 90).build();
    const opts = pipeline.getOptions();
    expect(opts.format).toBe("png");
    expect(opts.quality).toBe(90);
  });

  it("supports method chaining without mutating intermediate builders", () => {
    const builder = new ImagePipelineBuilder();
    const p1 = builder.withResize(100, 100).build();
    const p2 = builder.withFilter("blur").build();
    // p1 should not have the blur filter added in p2
    expect(p1.getOptions().filter).toBeUndefined();
    expect(p2.getOptions().filter).toBe("blur");
  });
});
```

- [ ] Run tests and verify all pass:

```bash
pnpm test:run tests/unit/images/pipeline-builder.test.ts
# Expected: 5 passed
```

> **NOTE:** The last test ("supports method chaining without mutating") will likely **fail** because `ImagePipelineBuilder` stores state in `this.options` and mutates it on each call. This is a real bug to fix during Phase 7 (SOLID/O8). Leave the test failing for now — it documents the bug.

- [ ] Commit:

```bash
git add tests/unit/images/pipeline-builder.test.ts
git commit -m "test(images): add unit tests for ImagePipelineBuilder"
```

### Task 2.2 — Unit test: hashtag parsing pure function

**Files:**
- Create: `app/modules/photos/utils/hashtag-parser.ts`
- Create: `tests/unit/photos/hashtag-parser.test.ts`

The hashtag parsing logic currently lives inline in `upload-photo.ts:76-82`. Extract it to a testable pure function first.

- [ ] Create `app/modules/photos/utils/hashtag-parser.ts`:

```typescript
export function parseHashtags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter((tag) => tag.length > 0 && tag.length <= 50);
}
```

- [ ] Update `app/modules/photos/procedures/upload-photo.ts` to use it (replace lines 76-82):

```typescript
import { parseHashtags } from "../utils/hashtag-parser";
// ...
const hashtagArray = parseHashtags(hashtags);
```

- [ ] Create `tests/unit/photos/hashtag-parser.test.ts`:

```typescript
// Unit test for hashtag parsing — pure function with no side effects.
// Reference: contrast with integration test (Task 3.x) which verifies hashtags are persisted.
import { describe, it, expect } from "vitest";
import { parseHashtags } from "~/modules/photos/utils/hashtag-parser";

describe("parseHashtags", () => {
  it("returns empty array for undefined input", () => {
    expect(parseHashtags(undefined)).toEqual([]);
  });

  it("strips leading # from tags", () => {
    expect(parseHashtags("#nature,#travel")).toEqual(["nature", "travel"]);
  });

  it("trims surrounding whitespace from tags", () => {
    expect(parseHashtags("  nature  ,  travel  ")).toEqual(["nature", "travel"]);
  });

  it("filters out empty tags after trimming", () => {
    expect(parseHashtags("nature,,travel")).toEqual(["nature", "travel"]);
  });

  it("filters out tags longer than 50 characters", () => {
    const longTag = "a".repeat(51);
    expect(parseHashtags(`nature,${longTag}`)).toEqual(["nature"]);
  });

  it("handles a mix of # prefixed and plain tags", () => {
    expect(parseHashtags("#sky,ocean,#mountain")).toEqual([
      "sky",
      "ocean",
      "mountain",
    ]);
  });
});
```

- [ ] Run and verify:

```bash
pnpm test:run tests/unit/photos/hashtag-parser.test.ts
# Expected: 6 passed
```

- [ ] Commit:

```bash
git add app/modules/photos/utils/hashtag-parser.ts \
        tests/unit/photos/hashtag-parser.test.ts \
        app/modules/photos/procedures/upload-photo.ts
git commit -m "test(photos): extract and test hashtag parsing pure function"
```

### Task 2.3 — Unit test: PackageService limit logic (mocked Prisma)

**Files:**
- Create: `tests/unit/photos/package-service.test.ts`

- [ ] Create `tests/unit/photos/package-service.test.ts`:

```typescript
// Unit test for PackageService — uses vi.mock to isolate from DB.
// Compare with integration test (Task 3.x) that hits a real test DB.
// Shows test double pattern: mock replaces external dependency (Prisma).
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma client before importing the service
vi.mock("~/lib/db/client", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    package: {
      findUnique: vi.fn(),
    },
    usageTracking: {
      findUnique: vi.fn(),
    },
  },
}));

import { PackageService } from "~/modules/packages/services/package-service";
import { prisma } from "~/lib/db/client";

describe("PackageService.checkUploadLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws if user is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(PackageService.checkUploadLimit("unknown-id")).rejects.toThrow(
      "User not found"
    );
  });

  it("throws when monthly photo limit is reached", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      packageType: "FREE",
    } as any);
    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      type: "FREE",
      maxPhotosPerMonth: 10,
      maxStorageGB: 1,
    } as any);
    vi.mocked(prisma.usageTracking.findUnique).mockResolvedValue({
      photosUploaded: 10,
      storageUsedMB: 0,
    } as any);

    await expect(PackageService.checkUploadLimit("u1")).rejects.toThrow(
      "Monthly upload limit reached"
    );
  });

  it("does not throw when limit is -1 (unlimited)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      packageType: "GOLD",
    } as any);
    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      type: "GOLD",
      maxPhotosPerMonth: -1,
      maxStorageGB: -1,
    } as any);
    vi.mocked(prisma.usageTracking.findUnique).mockResolvedValue(null);

    await expect(PackageService.checkUploadLimit("u1")).resolves.toBeUndefined();
  });
});
```

- [ ] Run and verify:

```bash
pnpm test:run tests/unit/photos/package-service.test.ts
# Expected: 3 passed
```

- [ ] Commit:

```bash
git add tests/unit/photos/package-service.test.ts
git commit -m "test(packages): add unit tests for PackageService upload limit logic"
```

**Acceptance Criteria (Phase 2):** `pnpm test:run tests/unit` passes ≥14 unit tests across 3 files.

---

## Phase 3 — Integration Tests (O3)

**Goal:** ≥3 integration tests that hit `PhotoRepository` against a real (test) PostgreSQL instance.  
**Effort:** M (2 hours)  
**Outcome:** O3

Integration tests run against the same Postgres instance but use a separate `gallery_test` database to avoid contaminating development data.

### Task 3.1 — Set up test database and Prisma test client

**Files:**
- Create: `tests/integration/setup.ts`
- Modify: `package.json`

- [ ] Add test DB config to `.env.test`:

```bash
# .env.test
DATABASE_URL="postgresql://gallery:gallery_password@localhost:5434/gallery_test?sslmode=disable"
```

- [ ] Add scripts to `package.json`:

```json
"test:integration": "dotenv -e .env.test vitest run tests/integration",
"db:test:setup": "dotenv -e .env.test prisma migrate deploy && dotenv -e .env.test prisma db seed"
```

- [ ] Install `dotenv-cli`:

```bash
pnpm add -D dotenv-cli
```

- [ ] Create test database via Docker:

```bash
docker exec gallery-postgres psql -U gallery -c "CREATE DATABASE gallery_test;"
pnpm db:test:setup
```

- [ ] Create `tests/integration/setup.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

export const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

export async function cleanDatabase() {
  await testPrisma.$executeRaw`TRUNCATE "Photo", "Hashtag", "PhotoHashtag", "UsageTracking", "AuditLog" CASCADE`;
}
```

### Task 3.2 — Integration tests for PhotoRepository

**Files:**
- Create: `tests/integration/photo-repository.test.ts`

- [ ] Create `tests/integration/photo-repository.test.ts`:

```typescript
// Integration test for PhotoRepository — hits real PostgreSQL.
// Compare with unit test (Task 2.x) where Prisma is mocked.
// Key difference: verifies that Prisma queries produce correct SQL,
// including JOIN behavior for hashtag relations and search filters.
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PhotoRepository } from "~/modules/photos/repositories/photo-repository";
import { testPrisma, cleanDatabase } from "./setup";

const repo = new PhotoRepository();

// Seed a real test user before running photo tests
async function seedTestUser() {
  return testPrisma.user.upsert({
    where: { email: "test@gallery.test" },
    update: {},
    create: {
      id: "test-user-id",
      email: "test@gallery.test",
      name: "Test User",
      role: "REGISTERED",
      packageType: "FREE",
    },
  });
}

describe("PhotoRepository (integration)", () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestUser();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("creates a photo with hashtags and retrieves it by id", async () => {
    const created = await repo.create({
      userId: "test-user-id",
      originalName: "test.jpg",
      storagePath: "originals/test.jpg",
      thumbnailPath: "thumbnails/test.jpg",
      mimeType: "image/jpeg",
      format: "jpg",
      sizeBytes: 1024,
      width: 800,
      height: 600,
      title: "Test photo",
      hashtags: ["nature", "travel"],
    });

    const found = await repo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe("Test photo");
    const tagNames = found!.hashtags.map((pt: any) => pt.hashtag.name);
    expect(tagNames).toContain("nature");
    expect(tagNames).toContain("travel");
  });

  it("filters photos by hashtag in search()", async () => {
    await repo.create({
      userId: "test-user-id",
      originalName: "a.jpg",
      storagePath: "originals/a.jpg",
      thumbnailPath: "thumbnails/a.jpg",
      mimeType: "image/jpeg",
      format: "jpg",
      sizeBytes: 500,
      width: 400,
      height: 300,
      hashtags: ["nature"],
    });
    await repo.create({
      userId: "test-user-id",
      originalName: "b.jpg",
      storagePath: "originals/b.jpg",
      thumbnailPath: "thumbnails/b.jpg",
      mimeType: "image/jpeg",
      format: "jpg",
      sizeBytes: 500,
      width: 400,
      height: 300,
      hashtags: ["urban"],
    });

    const results = await repo.search({ hashtags: ["nature"] });
    expect(results).toHaveLength(1);
    expect(results[0].hashtags.map((pt: any) => pt.hashtag.name)).toContain("nature");
  });

  it("filters photos by size range in search()", async () => {
    await repo.create({
      userId: "test-user-id",
      originalName: "small.jpg",
      storagePath: "originals/small.jpg",
      thumbnailPath: "thumbnails/small.jpg",
      mimeType: "image/jpeg",
      format: "jpg",
      sizeBytes: 100_000,
      width: 100, height: 100,
    });
    await repo.create({
      userId: "test-user-id",
      originalName: "large.jpg",
      storagePath: "originals/large.jpg",
      thumbnailPath: "thumbnails/large.jpg",
      mimeType: "image/jpeg",
      format: "jpg",
      sizeBytes: 5_000_000,
      width: 4000, height: 3000,
    });

    const results = await repo.search({ minSize: 1_000_000 });
    expect(results).toHaveLength(1);
    expect(results[0].sizeBytes).toBeGreaterThanOrEqual(1_000_000);
  });
});
```

- [ ] Run and verify:

```bash
pnpm test:integration
# Expected: 3 passed
```

- [ ] Commit:

```bash
git add tests/integration/ .env.test
git commit -m "test(repository): add integration tests for PhotoRepository"
```

**Acceptance Criteria (Phase 3):** `pnpm test:integration` passes ≥3 tests hitting real PostgreSQL.

---

## Phase 4 — UI (End-to-End) Tests with Playwright (O3)

**Goal:** ≥2 UI tests covering auth flow and photo search.  
**Effort:** M (2 hours)  
**Outcome:** O3

### Task 4.1 — UI test: Authentication page

**Files:**
- Create: `tests/ui/auth.spec.ts`

- [ ] Create `tests/ui/auth.spec.ts`:

```typescript
// E2E test for the authentication page.
// Compare with unit test (Task 2.x): unit tests test logic in isolation;
// UI tests verify the full stack — DOM rendering, form submission, redirect.
import { test, expect } from "@playwright/test";

test.describe("Authentication page", () => {
  test("shows login form by default", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation error when submitting empty form", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Expect HTML5 validation or server-side error message
    await expect(
      page.getByText(/email.*required|invalid email/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("switches to register tab when clicking Register link", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("tab", { name: /register/i }).click();
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
  });
});
```

### Task 4.2 — UI test: Home page and search

**Files:**
- Create: `tests/ui/home.spec.ts`

- [ ] Create `tests/ui/home.spec.ts`:

```typescript
// E2E test for the home/gallery page.
// Verifies that search UI is present and interactable before login redirect.
import { test, expect } from "@playwright/test";

test.describe("Home page (unauthenticated)", () => {
  test("redirects unauthenticated users to /auth", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth/);
  });
});

// Authenticated tests require a seeded test user session.
// The beforeEach sets up auth state via storage state (Playwright auth fixture).
test.describe("Home page (authenticated)", () => {
  test.use({ storageState: "tests/ui/.auth/user.json" });

  test.beforeAll(async ({ browser }) => {
    // Log in once and save session for all authenticated tests
    const page = await browser.newPage();
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("admin@gallery.test");
    await page.getByLabel(/password/i).fill("Admin123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
    await page.context().storageState({ path: "tests/ui/.auth/user.json" });
    await page.close();
  });

  test("shows photo grid on home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("photo-grid")).toBeVisible();
  });

  test("search bar is visible and accepts input", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.getByPlaceholder(/search|hashtag/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("nature");
    await expect(searchInput).toHaveValue("nature");
  });
});
```

- [ ] Create auth state directory:

```bash
mkdir -p tests/ui/.auth
echo '{"cookies":[],"origins":[]}' > tests/ui/.auth/user.json
```

- [ ] Verify Playwright tests run (expect some to fail until auth is set up):

```bash
pnpm test:ui --project=chromium
```

- [ ] Commit:

```bash
git add tests/ui/
git commit -m "test(ui): add Playwright E2E tests for auth and home page"
```

- [ ] Merge feature branch back to develop:

```bash
git checkout develop
git merge --squash feature/testing-infrastructure
git commit -m "feat: add complete testing infrastructure (unit + integration + UI)"
git checkout -b feature/aop-decorators
```

**Acceptance Criteria (Phase 4):** `pnpm test:ui` runs ≥5 UI tests. Auth tests pass. `pnpm test:run` shows ≥10 total unit + integration tests.

---

## Phase 5 — AOP Decorators (O6)

**Goal:** Implement ≥2 aspects with ≥5 usages using TypeScript legacy decorators (already enabled).  
**Effort:** M (2-3 hours)  
**Outcome:** O6

### Task 5.1 — Create decorator library

**Files:**
- Create: `app/aspects/log.decorator.ts`
- Create: `app/aspects/perf.decorator.ts`
- Create: `app/aspects/handle-errors.decorator.ts`
- Create: `app/aspects/cache.decorator.ts`
- Create: `app/aspects/index.ts`

TypeScript legacy decorators work on class methods and wrap them at definition time.

- [ ] Create `app/aspects/log.decorator.ts`:

```typescript
// ASPECT: Logging — logs method entry/exit with arguments and result.
// Applied to: ImageProcessingService.processUpload, ImageProcessingService.processDownload
export function Log(prefix?: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const label = prefix ?? `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = async function (...args: unknown[]) {
      console.log(`[LOG] ${label} called with`, JSON.stringify(args).slice(0, 200));
      const result = await originalMethod.apply(this, args);
      console.log(`[LOG] ${label} returned`, JSON.stringify(result).slice(0, 200));
      return result;
    };

    return descriptor;
  };
}
```

- [ ] Create `app/aspects/perf.decorator.ts`:

```typescript
// ASPECT: Performance timing — measures and logs method execution time.
// Applied to: ImageProcessingService.processUpload, ImageProcessingService.processDownload
export function Perf(thresholdMs = 0): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const label = `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = async function (...args: unknown[]) {
      const start = performance.now();
      const result = await originalMethod.apply(this, args);
      const durationMs = performance.now() - start;

      if (durationMs >= thresholdMs) {
        console.log(`[PERF] ${label} took ${durationMs.toFixed(2)}ms`);
      }
      return result;
    };

    return descriptor;
  };
}
```

- [ ] Create `app/aspects/handle-errors.decorator.ts`:

```typescript
// ASPECT: Error handling — catches, logs, and rethrows errors with context.
// Applied to: PackageService.checkUploadLimit, AuditService.log
export function HandleErrors(fallback?: unknown): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const label = `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[ERROR] ${label} threw: ${message}`);
        if (fallback !== undefined) return fallback;
        throw error;
      }
    };

    return descriptor;
  };
}
```

- [ ] Create `app/aspects/cache.decorator.ts`:

```typescript
// ASPECT: Result caching — memoizes method return values for a TTL period.
// Applied to: PhotoRepository.search
const _cache = new Map<string, { value: unknown; expiresAt: number }>();

export function Cache(ttlMs = 60_000): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const label = `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = async function (...args: unknown[]) {
      const key = `${label}:${JSON.stringify(args)}`;
      const cached = _cache.get(key);

      if (cached && Date.now() < cached.expiresAt) {
        console.log(`[CACHE] Hit for ${label}`);
        return cached.value;
      }

      const result = await originalMethod.apply(this, args);
      _cache.set(key, { value: result, expiresAt: Date.now() + ttlMs });
      return result;
    };

    return descriptor;
  };
}
```

- [ ] Create `app/aspects/index.ts`:

```typescript
export { Log } from "./log.decorator";
export { Perf } from "./perf.decorator";
export { HandleErrors } from "./handle-errors.decorator";
export { Cache } from "./cache.decorator";
```

### Task 5.2 — Apply aspects to production code

**Files:**
- Modify: `app/modules/images/services/image-processing-service.ts`
- Modify: `app/modules/photos/repositories/photo-repository.ts`
- Modify: `app/modules/packages/services/package-service.ts`
- Modify: `app/modules/audit/services/audit-service.ts`

> This requires converting static methods to instance methods where decorators don't work on static methods in legacy TS decorators, OR converting the classes to use instance methods. The `ImageProcessingService` and `PackageService` currently use static methods. Easiest fix: convert to singleton instances in those files (see SOLID DIP fix in Phase 7).

- [ ] Apply `@Log` and `@Perf` to `ImageProcessingService.processUpload` and `processDownload`:

```typescript
// In image-processing-service.ts — convert to instance methods + apply decorators
import { Log, Perf, HandleErrors } from "~/aspects";

export class ImageProcessingService {
  // ... (inject storage strategy via constructor — see Phase 7 DIP fix)

  @Log("ImageProcessingService.processUpload")
  @Perf(100)
  async processUpload(
    fileBuffer: Buffer,
    originalFilename: string,
    options?: ProcessUploadOptions,
  ): Promise<ProcessUploadResult> {
    // ... existing implementation unchanged
  }

  @Log("ImageProcessingService.processDownload")
  @Perf(50)
  async processDownload(
    // ... existing implementation unchanged
  ): Promise<ProcessDownloadResult> { }
}
```

- [ ] Apply `@Log` and `@Cache(30_000)` to `PhotoRepository.search`:

```typescript
// In photo-repository.ts
import { Log, Cache } from "~/aspects";

export class PhotoRepository {
  @Log()
  @Cache(30_000)
  async search(criteria: SearchCriteria): Promise<Photo[]> {
    // ... existing implementation unchanged
  }
}
```

- [ ] Apply `@HandleErrors` to `PackageService.checkUploadLimit`:

```typescript
// In package-service.ts
import { HandleErrors } from "~/aspects";

export class PackageService {
  @HandleErrors()
  async checkUploadLimit(userId: string): Promise<void> {
    // ... existing implementation unchanged
  }
}
```

- [ ] Apply `@HandleErrors({ silent: true })` to `AuditService.log`:

```typescript
// In audit-service.ts
import { HandleErrors } from "~/aspects";

export class AuditService {
  @HandleErrors()
  async log(input: AuditLogInput): Promise<void> {
    // ... existing implementation unchanged (remove the try/catch)
  }
}
```

- [ ] Run existing tests to verify no regressions:

```bash
pnpm test:run
```

- [ ] Commit:

```bash
git add app/aspects/ app/modules/
git commit -m "feat(aop): add Log, Perf, HandleErrors, Cache decorators with 5 usages"
```

- [ ] Merge to develop and create next branch:

```bash
git checkout develop
git merge --squash feature/aop-decorators
git commit -m "feat: add AOP decorator library (O6)"
git checkout -b feature/functional-refactoring
```

**Acceptance Criteria:** `grep -r "@Log\|@Perf\|@Cache\|@HandleErrors" app/` shows ≥5 usages. Tests still pass.

---

## Phase 6 — Functional Programming Refactoring (O5)

**Goal:** Refactor ≥5 methods to use functional-style patterns. Each has a documented before/after.  
**Effort:** L (3-4 hours)  
**Outcome:** O5

### Task 6.1 — Create Result<T> type for Railway-Oriented Programming

**Files:**
- Create: `app/lib/result.ts`

- [ ] Create `app/lib/result.ts`:

```typescript
// Result<T, E> enables Railway-Oriented Programming:
// functions return Ok(value) | Err(error) instead of throwing.
// This makes error paths explicit in the type system.

export type Ok<T> = { ok: true; value: T };
export type Err<E = Error> = { ok: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const Result = {
  ok: <T>(value: T): Ok<T> => ({ ok: true, value }),
  err: <E = Error>(error: E): Err<E> => ({ ok: false, error }),
  isOk: <T, E>(r: Result<T, E>): r is Ok<T> => r.ok,
  isErr: <T, E>(r: Result<T, E>): r is Err<E> => !r.ok,

  map: <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
    r.ok ? Result.ok(fn(r.value)) : r,

  flatMap: <T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> =>
    r.ok ? fn(r.value) : r,

  getOrThrow: <T, E extends Error>(r: Result<T, E>): T => {
    if (r.ok) return r.value;
    throw r.error;
  },
};
```

### Task 6.2 — FP refactor #1: Hashtag parsing (pure function + pipe)

Already done in Task 2.2. The `parseHashtags` function is already a pure function. Document it:

```
BEFORE (inline in upload-photo.ts:76-82):
  const hashtagArray = hashtags
    ? hashtags.split(",").map(tag => tag.trim().replace(/^#/, ""))
        .filter(tag => tag.length > 0 && tag.length <= 50)
    : [];

AFTER (app/modules/photos/utils/hashtag-parser.ts):
  export function parseHashtags(raw: string | undefined): string[] { ... }
  // Pure function: same input always yields same output, no side effects.
```

### Task 6.3 — FP refactor #2: Search criteria builder using compose

**Files:**
- Create: `app/modules/photos/utils/search-criteria-builder.ts`
- Modify: `app/modules/photos/repositories/photo-repository.ts`

- [ ] Create `app/modules/photos/utils/search-criteria-builder.ts`:

```typescript
// BEFORE: photo-repository.ts:93-130 — imperative where clause assembly:
//   const where: Prisma.PhotoWhereInput = {};
//   if (criteria.hashtags && ...) { where.hashtags = { ... } }
//   if (criteria.minSize !== undefined ...) { where.sizeBytes = {} ... }
//   ... (7 more if statements)
//
// AFTER: Pure functions composed via pipe(). Each filter is independent,
// composable, and individually testable.

import type { Prisma } from "@prisma/client";
import type { SearchCriteria } from "../repositories/photo-repository";

type WhereFilter = (where: Prisma.PhotoWhereInput) => Prisma.PhotoWhereInput;

export function withHashtagFilter(hashtags?: string[]): WhereFilter {
  return (where) =>
    hashtags && hashtags.length > 0
      ? { ...where, hashtags: { some: { hashtag: { name: { in: hashtags } } } } }
      : where;
}

export function withSizeFilter(min?: number, max?: number): WhereFilter {
  return (where) => {
    if (min === undefined && max === undefined) return where;
    return {
      ...where,
      sizeBytes: {
        ...(min !== undefined ? { gte: min } : {}),
        ...(max !== undefined ? { lte: max } : {}),
      },
    };
  };
}

export function withDateFilter(from?: Date, to?: Date): WhereFilter {
  return (where) => {
    if (!from && !to) return where;
    return {
      ...where,
      uploadedAt: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    };
  };
}

export function withAuthorFilter(authorId?: string): WhereFilter {
  return (where) => (authorId ? { ...where, userId: authorId } : where);
}

// Compose: applies filters left to right, each returning a new where object.
export function buildSearchWhere(criteria: SearchCriteria): Prisma.PhotoWhereInput {
  const filters: WhereFilter[] = [
    withHashtagFilter(criteria.hashtags),
    withSizeFilter(criteria.minSize, criteria.maxSize),
    withDateFilter(criteria.dateFrom, criteria.dateTo),
    withAuthorFilter(criteria.authorId),
  ];
  return filters.reduce((where, filter) => filter(where), {} as Prisma.PhotoWhereInput);
}
```

- [ ] Update `PhotoRepository.search` to use `buildSearchWhere`:

```typescript
// In photo-repository.ts — replace the 30-line where-building block
import { buildSearchWhere } from "../utils/search-criteria-builder";

async search(criteria: SearchCriteria): Promise<Photo[]> {
  return await prisma.photo.findMany({
    where: buildSearchWhere(criteria),
    take: criteria.limit ?? 50,
    skip: criteria.offset ?? 0,
    orderBy: { uploadedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      hashtags: { include: { hashtag: true } },
    },
  });
}
```

### Task 6.4 — FP refactor #3: Photo response mapper (pure HOF)

**Files:**
- Create: `app/modules/photos/utils/photo-mappers.ts`
- Modify: `app/modules/photos/procedures/search-photos.ts`
- Modify: `app/modules/photos/procedures/get-photos.ts`

- [ ] Create `app/modules/photos/utils/photo-mappers.ts`:

```typescript
// BEFORE: search-photos.ts:36-55 — inline .map() with 12 fields hardcoded
//   photos.map((photo) => ({ id: photo.id, title: photo.title, ... }))
//
// AFTER: Reusable pure transformation function usable in all procedures.
// Higher-order function pattern: mapPhotoToDto takes no extra config,
// returns a pure Photo → DTO transformation.

import type { Photo } from "@prisma/client";

export type PhotoDto = {
  id: string;
  title: string | null;
  description: string | null;
  thumbnailPath: string;
  width: number;
  height: number;
  sizeBytes: number;
  hashtags: string[];
  author: { id: string; name: string | null; email: string };
  viewCount: number;
  downloadCount: number;
  uploadedAt: Date;
};

export function mapPhotoToDto(photo: Photo & {
  hashtags: Array<{ hashtag: { name: string } }>;
  user: { id: string; name: string | null; email: string };
}): PhotoDto {
  return {
    id: photo.id,
    title: photo.title,
    description: photo.description,
    thumbnailPath: photo.thumbnailPath,
    width: photo.width,
    height: photo.height,
    sizeBytes: photo.sizeBytes,
    hashtags: photo.hashtags.map((pt) => pt.hashtag.name),
    author: photo.user,
    viewCount: photo.viewCount,
    downloadCount: photo.downloadCount,
    uploadedAt: photo.uploadedAt,
  };
}

// Higher-order function: creates a paginated response from a mapper and results
export function toPagedResponse<T, U>(
  items: T[],
  mapper: (item: T) => U,
  meta?: Record<string, unknown>
) {
  return {
    success: true as const,
    photos: items.map(mapper),
    total: items.length,
    ...meta,
  };
}
```

- [ ] Update `search-photos.ts` to use the mapper:

```typescript
import { mapPhotoToDto, toPagedResponse } from "../utils/photo-mappers";
// Replace inline .map() with:
return toPagedResponse(photos, mapPhotoToDto, { criteria: { ... } });
```

### Task 6.5 — FP refactor #4: processDownload pipeline using function composition

**Files:**
- Modify: `app/modules/images/services/image-processing-service.ts`

- [ ] Refactor `processDownload` to use functional pipeline composition:

```typescript
// BEFORE: image-processing-service.ts:89-139 — imperative builder with if/else:
//   const builder = new ImagePipelineBuilder();
//   if (options.resize) { builder.withResize(...); }
//   if (options.filters?.length > 0) { for (const f of filters) builder.withFilter(f); }
//
// AFTER: Compose an array of pure builder-transforming functions,
// then reduce over them to produce the final builder state.

type BuilderTransform = (b: ImagePipelineBuilder) => ImagePipelineBuilder;

function applyResize(resize?: { width: number; height: number; fit?: "cover" | "contain" | "fill" }): BuilderTransform {
  return (b) => resize ? b.withResize(resize.width, resize.height, resize.fit as "cover" | "contain") : b;
}

function applyFilters(filters?: string[]): BuilderTransform {
  return (b) =>
    (filters ?? []).reduce(
      (acc, f) => acc.withFilter(f as "sepia" | "blur" | "grayscale" | "sharpen"),
      b
    );
}

function applyFormat(format?: string, quality?: number): BuilderTransform {
  return (b) => format ? b.withFormat(format as "jpg" | "png" | "bmp" | "webp", quality) : b;
}

// In processDownload:
const transforms: BuilderTransform[] = [
  applyResize(options.resize),
  applyFilters(options.filters),
  applyFormat(options.format, options.quality),
];

const builder = transforms.reduce(
  (b, transform) => transform(b),
  new ImagePipelineBuilder()
);

const processedBuffer = await builder.build().execute(fileBuffer);
```

### Task 6.6 — FP refactor #5: checkUploadLimit with Result<T>

**Files:**
- Modify: `app/modules/packages/services/package-service.ts`
- Create: `app/modules/packages/utils/limit-checker.ts`

- [ ] Create `app/modules/packages/utils/limit-checker.ts`:

```typescript
// BEFORE: PackageService.checkUploadLimit — throws exceptions for all error cases.
// Mixing control flow (throw) with business logic.
//
// AFTER: Railway-Oriented Programming — returns Result<void, string>.
// Callers explicitly handle the error path without try/catch.

import { Result } from "~/lib/result";
import type { Package, UsageTracking } from "@prisma/client";

export function checkMonthlyPhotoLimit(
  pkg: Package,
  usage: UsageTracking | null
): Result<void, string> {
  if (pkg.maxPhotosPerMonth === -1) return Result.ok(undefined);
  const uploaded = usage?.photosUploaded ?? 0;
  if (uploaded >= pkg.maxPhotosPerMonth) {
    return Result.err(`Monthly upload limit reached (${pkg.maxPhotosPerMonth} photos)`);
  }
  return Result.ok(undefined);
}

export function checkStorageLimit(
  pkg: Package,
  usage: UsageTracking | null
): Result<void, string> {
  if (pkg.maxStorageGB === -1) return Result.ok(undefined);
  const usedGB = (usage?.storageUsedMB ?? 0) / 1024;
  if (usedGB >= pkg.maxStorageGB) {
    return Result.err(
      `Storage limit reached (${pkg.maxStorageGB}GB). Upgrade or delete photos.`
    );
  }
  return Result.ok(undefined);
}

export function combineResults(...results: Result<void, string>[]): Result<void, string> {
  const firstError = results.find(Result.isErr);
  return firstError ?? Result.ok(undefined);
}
```

- [ ] Update `PackageService.checkUploadLimit` to use it:

```typescript
import { checkMonthlyPhotoLimit, checkStorageLimit, combineResults } from "../utils/limit-checker";
import { Result } from "~/lib/result";

static async checkUploadLimit(userId: string): Promise<void> {
  // ... (fetch user, pkg, usage — unchanged)
  const limitResult = combineResults(
    checkMonthlyPhotoLimit(pkg, usage),
    checkStorageLimit(pkg, usage)
  );
  if (!limitResult.ok) throw new Error(limitResult.error);
}
```

- [ ] Run all tests:

```bash
pnpm test:run
# All unit tests should still pass, including PackageService tests from Phase 2
```

- [ ] Commit:

```bash
git add app/lib/result.ts app/modules/photos/utils/ app/modules/packages/utils/ \
        app/modules/images/services/ app/modules/photos/repositories/
git commit -m "refactor(fp): 5 functional refactors — pure functions, HOF, Result<T>, composition"
```

**Acceptance Criteria:** 5 distinct functional techniques demonstrated with before/after. All existing tests pass. `grep -r "Result\." app/modules/packages` shows usage.

---

## Phase 7 — SOLID Refactoring (O8)

**Goal:** Demonstrate ≥4 SOLID principles with concrete before/after from this codebase.  
**Effort:** M (2-3 hours)  
**Outcome:** O8 (code part, 6 pts)

### Task 7.1 — SRP: Split PackageService

**Files:**
- Create: `app/modules/packages/services/usage-tracker.ts`
- Create: `app/modules/packages/services/capability-checker.ts`
- Modify: `app/modules/packages/services/package-service.ts`

```
BEFORE: PackageService has 8 static methods covering:
  - Fetching package config (getPackage, getUserPackage)
  - Upload limit enforcement (checkUploadLimit)
  - Usage mutation (trackUpload, trackDownload)
  - Capability queries (canDownloadOriginal, canApplyFilters, getMaxFilters)
  One class, 3 responsibilities.

AFTER:
  - PackageService: fetches package config only (getPackage, getUserPackage)
  - UsageTracker: trackUpload, trackDownload, checkUploadLimit
  - CapabilityChecker: canDownloadOriginal, canApplyFilters, getMaxFilters
```

- [ ] Create `app/modules/packages/services/usage-tracker.ts` with `checkUploadLimit`, `trackUpload`, `trackDownload` methods extracted from `PackageService`.

- [ ] Create `app/modules/packages/services/capability-checker.ts` with `canDownloadOriginal`, `canApplyFilters`, `getMaxFilters` extracted.

- [ ] Update all procedures that import `PackageService` to import from the correct split service.

### Task 7.2 — OCP: Open image filter registry

**Files:**
- Create: `app/modules/images/filters/filter-registry.ts`
- Modify: `app/modules/images/processors/sharp-processor.ts`

```
BEFORE: sharp-processor.ts applies filters via a hardcoded if/else chain:
  if (opts.filter === "sepia") pipeline.recomb(...);
  else if (opts.filter === "blur") pipeline.blur(...);
  ...
  Adding a new filter requires editing SharpProcessor — violates OCP.

AFTER: A filter registry maps filter names to Sharp transform functions.
  New filters are added by registering them — SharpProcessor never changes.
```

- [ ] Create `app/modules/images/filters/filter-registry.ts`:

```typescript
import type sharp from "sharp";

type SharpTransform = (pipeline: sharp.Sharp) => sharp.Sharp;

const registry = new Map<string, SharpTransform>([
  ["sepia", (p) => p.recomb([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]])],
  ["blur", (p) => p.blur(3)],
  ["grayscale", (p) => p.grayscale()],
  ["sharpen", (p) => p.sharpen()],
]);

export function applyRegisteredFilter(pipeline: sharp.Sharp, filterName: string): sharp.Sharp {
  const transform = registry.get(filterName);
  if (!transform) throw new Error(`Unknown filter: ${filterName}`);
  return transform(pipeline);
}

export function registerFilter(name: string, transform: SharpTransform): void {
  registry.set(name, transform);
}
```

### Task 7.3 — DIP: Inject StorageStrategy into ImageProcessingService

**Files:**
- Modify: `app/modules/images/services/image-processing-service.ts`

```
BEFORE: ImageProcessingService.ts:27:
  private static storage = new LocalStorageStrategy();
  High-level module directly instantiates a low-level module — violates DIP.

AFTER: StorageStrategy is injected via constructor. The service depends on
  the abstract StorageStrategy interface, not LocalStorageStrategy concretely.
```

- [ ] Refactor `ImageProcessingService` to accept a `StorageStrategy` in its constructor:

```typescript
export class ImageProcessingService {
  constructor(private storage: StorageStrategy = new LocalStorageStrategy()) {}

  async processUpload(...): Promise<ProcessUploadResult> {
    // use this.storage.store(...) instead of this.storage.store(...)  [same API]
  }
}
```

- [ ] Update callers (the procedures) to construct the service:

```typescript
// In upload-photo.ts
const imageService = new ImageProcessingService(); // uses LocalStorage by default
// Or with injection: new ImageProcessingService(new CloudStorageStrategy())
```

### Task 7.4 — LSP: Document StorageStrategy compliance

```
BEFORE: CloudStorageStrategy is a stub that throws "Not implemented".
  Substituting it for LocalStorageStrategy in production would break the app — LSP violation.

AFTER: CloudStorageStrategy implements all StorageStrategy methods (even as no-ops
  or mocks), so it is safely substitutable. Document the contract in the interface.
```

- [ ] Update `storage-strategy.interface.ts` with explicit JSDoc contracts:

```typescript
export interface StorageStrategy {
  /** Store buffer and return the path. MUST NOT throw for valid buffers. */
  store(buffer: Buffer, folder: string): Promise<string>;
  /** Retrieve by path. Throws StorageNotFoundError if path doesn't exist. */
  retrieve(path: string): Promise<Buffer>;
  /** Delete by path. No-op if path doesn't exist (idempotent). */
  delete(path: string): Promise<void>;
}
```

- [ ] Fix `CloudStorageStrategy` to implement all methods without throwing:

```typescript
export class CloudStorageStrategy implements StorageStrategy {
  async store(buffer: Buffer, folder: string): Promise<string> {
    // Placeholder — returns a mock path until cloud SDK is integrated
    return `cloud://${folder}/${Date.now()}.jpg`;
  }
  async retrieve(path: string): Promise<Buffer> {
    return Buffer.from([]);
  }
  async delete(path: string): Promise<void> {
    // no-op placeholder
  }
}
```

- [ ] Run all tests:

```bash
pnpm test:run
```

- [ ] Commit:

```bash
git add app/modules/
git commit -m "refactor(solid): SRP package split, OCP filter registry, DIP storage injection, LSP contracts"
```

- [ ] Also fix the static/instance bug in `upload-photo.ts:84` (call `repo.create` on an instance):

```typescript
// Add at top of upload-photo.ts
const photoRepository = new PhotoRepository();
// ... then use photoRepository.create(...) instead of PhotoRepository.create(...)
```

**Acceptance Criteria:** 4 SOLID principles demonstrated with before/after comments. All tests pass. The static/instance bug is fixed.

---

## Phase 8 — Containerization (O8)

**Goal:** App Dockerfile (multi-stage), `.dockerignore`, and full docker-compose with app + db services.  
**Effort:** S (1.5 hours)  
**Outcome:** O8 (Docker, 4 pts)

### Task 8.1 — Create Dockerfile

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Modify: `docker-compose.yml`

- [ ] Create `Dockerfile`:

```dockerfile
# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build the app
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run db:generate && pnpm run build

# Stage 3: Production runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
# Only copy production artifacts
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
RUN mkdir -p storage/originals storage/processed storage/thumbnails
EXPOSE 3000
CMD ["pnpm", "start"]
```

- [ ] Create `.dockerignore`:

```
node_modules
.git
.github
.claude
storage
prisma/dev.db
prisma/migrations/dev
tests
docs
*.md
.env
.env.*
!.env.example
build
.react-router
```

- [ ] Update `docker-compose.yml` to add the app service:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: gallery-postgres
    environment:
      POSTGRES_USER: gallery
      POSTGRES_PASSWORD: gallery_password
      POSTGRES_DB: gallery_db
    ports:
      - "5434:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gallery -d gallery_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: gallery-app
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://gallery:gallery_password@postgres:5432/gallery_db?sslmode=disable"
      BETTER_AUTH_SECRET: "${BETTER_AUTH_SECRET}"
      BETTER_AUTH_URL: "${BETTER_AUTH_URL:-http://localhost:3000}"
      STORAGE_PATH: "/app/storage"
      NODE_ENV: "production"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - gallery_storage:/app/storage

volumes:
  postgres_data:
  gallery_storage:
```

- [ ] Build and verify:

```bash
docker compose build app
docker compose up -d
# Verify app is running
curl http://localhost:3000
```

- [ ] Commit:

```bash
git add Dockerfile .dockerignore docker-compose.yml
git commit -m "feat(docker): add multi-stage Dockerfile and full docker-compose setup"
```

**Acceptance Criteria:** `docker compose up` starts both postgres and app. App responds on port 3000.

---

## Phase 9 — Metrics & Monitoring (O9)

**Goal:** ≥5 metrics (≥1 custom) exposed via Prometheus endpoint.  
**Effort:** M (2-3 hours)  
**Outcome:** O9

### Task 9.1 — Install prom-client and create metrics module

**Files:**
- Create: `app/lib/metrics/metrics.ts`
- Create: `app/lib/metrics/middleware.ts`
- Create: `app/routes/api/metrics.ts`

- [ ] Install:

```bash
pnpm add prom-client
```

- [ ] Create `app/lib/metrics/metrics.ts`:

```typescript
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

export const registry = new Registry();
registry.setDefaultLabels({ app: "gallery" });

// 1. Request rate (Counter)
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"],
  registers: [registry],
});

// 2. Request duration (Histogram)
export const httpRequestDurationMs = new Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "path"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [registry],
});

// 3. Error rate (Counter)
export const httpErrorsTotal = new Counter({
  name: "http_errors_total",
  help: "Total HTTP error responses",
  labelNames: ["method", "path", "status"],
  registers: [registry],
});

// 4. Memory usage (Gauge) — via process default metrics
collectDefaultMetrics({ register: registry });

// 5. DB query duration (Histogram)
export const dbQueryDurationMs = new Histogram({
  name: "db_query_duration_ms",
  help: "Prisma database query duration in milliseconds",
  labelNames: ["model", "operation"],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500],
  registers: [registry],
});

// 6. CUSTOM: Photos uploaded (domain-specific Counter)
export const photosUploadedTotal = new Counter({
  name: "photos_uploaded_total",
  help: "Total number of photos uploaded, labeled by package type",
  labelNames: ["package_type"],
  registers: [registry],
});

// 7. CUSTOM: Active download operations (Gauge)
export const activeDownloads = new Gauge({
  name: "active_downloads_current",
  help: "Number of image download operations currently in progress",
  registers: [registry],
});
```

- [ ] Create `app/routes/api/metrics.ts` (expose `/api/metrics` for Prometheus scraping):

```typescript
import type { Route } from "./+types/metrics";
import { registry } from "~/lib/metrics/metrics";

export async function loader({ request }: Route.LoaderArgs) {
  const metrics = await registry.metrics();
  return new Response(metrics, {
    headers: {
      "Content-Type": registry.contentType,
      "Cache-Control": "no-cache",
    },
  });
}
```

- [ ] Register the metrics route in `app/routes.ts`:

```typescript
route("/api/metrics", "routes/api/metrics.ts"),
```

- [ ] Instrument `uploadPhoto` procedure to increment `photosUploadedTotal`:

```typescript
import { photosUploadedTotal } from "~/lib/metrics/metrics";
// After successful upload, add:
photosUploadedTotal.inc({ package_type: userPackage.type });
```

- [ ] Instrument `downloadOriginal` procedure to track `activeDownloads`:

```typescript
import { activeDownloads } from "~/lib/metrics/metrics";
activeDownloads.inc();
// ... download logic ...
activeDownloads.dec();
```

- [ ] Add Prometheus + Grafana to `docker-compose.yml`:

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: gallery-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    container_name: gallery-grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
```

- [ ] Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "gallery-app"
    static_configs:
      - targets: ["app:3000"]
    metrics_path: "/api/metrics"
```

- [ ] Verify metrics endpoint:

```bash
curl http://localhost:3000/api/metrics
# Should return Prometheus text format with all 7 metrics
```

- [ ] Commit:

```bash
git add app/lib/metrics/ app/routes/api/metrics.ts monitoring/ docker-compose.yml
git commit -m "feat(metrics): add 7 Prometheus metrics including 2 custom domain metrics"
```

**Acceptance Criteria:** `curl /api/metrics` returns Prometheus format. ≥5 metrics visible. Grafana dashboard at port 3001 shows data after running the app.

---

## Phase 10 — Performance Optimizations & Benchmarks (O4)

**Goal:** Document and implement ≥3 concrete optimizations with benchmarks.  
**Effort:** M (2 hours)  
**Outcome:** O4

### Task 10.1 — Create benchmark suite

**Files:**
- Create: `benchmarks/hashtag-parser.bench.ts`
- Create: `benchmarks/search-criteria.bench.ts`

- [ ] Create `benchmarks/hashtag-parser.bench.ts`:

```typescript
import { bench, describe } from "vitest";
import { parseHashtags } from "~/modules/photos/utils/hashtag-parser";

describe("hashtag parsing", () => {
  const input = "#nature, #travel, #photography, beach, #sunset, mountain";

  bench("parseHashtags (pure function)", () => {
    parseHashtags(input);
  });

  // BEFORE: inline version (not extracted) for comparison
  bench("inline parsing (before refactor)", () => {
    input.split(",").map(t => t.trim().replace(/^#/, "")).filter(t => t.length > 0 && t.length <= 50);
  });
});
```

- [ ] Add bench script to `package.json`:

```json
"bench": "vitest bench"
```

- [ ] Run benchmarks:

```bash
pnpm bench
```

### Task 10.2 — Document 3 optimizations with before/after

Create `docs/optimizations.md`:

```markdown
# Performance Optimizations

## Optimization 1: Prisma N+1 Query fix in getPhotos

BEFORE: getPhotos fetched each user separately per photo (N+1 queries).
PhotoRepository.findMany() already uses `include: { user: true }` — this is correct.
Verify no N+1 exists by checking Prisma query logs.

AFTER (if N+1 found): Add `select` to limit fields fetched from user relation,
reducing data transfer.

## Optimization 2: In-memory caching for search results

BEFORE: Every search call hits the database, even for the same hashtag query.
Added @Cache(30_000) decorator to PhotoRepository.search (Phase 5).

AFTER: Repeated identical search queries within 30s return cached results,
reducing DB load under browsing traffic.

## Optimization 3: Parallel image processing and storage

BEFORE (conceptual): processUpload could store original then thumbnail sequentially.
AFTER: app/modules/images/services/image-processing-service.ts:69-72 already uses
Promise.all([store original, store thumbnail]) — confirm this is the case and document it.

## Optimization 4: Buffer reuse for thumbnail generation

BEFORE: processUpload calls sharp(fileBuffer).metadata() twice (lines 35, 75).
AFTER: Cache the first metadata call result and reuse it.
```

- [ ] Apply optimization 4 in `image-processing-service.ts`:

```typescript
// Cache initial metadata, reuse at bottom
const initialMetadata = await sharp(fileBuffer).metadata();
// ... processing ...
const finalMetadata = processedBuffer === fileBuffer
  ? initialMetadata  // No processing was done, reuse
  : await sharp(processedBuffer).metadata();
```

- [ ] Commit:

```bash
git add benchmarks/ docs/optimizations.md app/modules/images/services/
git commit -m "perf: add benchmarks and document 4 optimizations (caching, parallel ops, metadata reuse)"
```

---

## Phase 11 — UI Redesign

**Goal:** Modernize the gallery UI to a clean, professional dark-mode design with glassmorphism accents.  
**Effort:** L (4-6 hours)  
**Outcome:** Bonus (presentation quality)

### Design Direction

**Style:** Dark glassmorphism + minimal grid. Think Unsplash meets a dark macOS app.

**Color Palette:**
- Background: `#0a0a0a` (near black)
- Surface: `#111111` (dark card bg)
- Glass: `rgba(255,255,255,0.05)` with `backdrop-filter: blur(12px)`
- Accent: `#6366f1` (indigo-500) → hover `#818cf8`
- Muted text: `#6b7280`
- Border: `rgba(255,255,255,0.08)`

**Typography:**
- Headings: Inter 700 / Geist Bold
- Body: Inter 400
- Mono: JetBrains Mono (for IDs, metadata)

**Key UI Changes:**

| Area | Change |
|------|--------|
| Root layout | Dark background, left sidebar nav instead of top nav |
| Photo grid | Masonry layout (CSS columns), hover overlay with title + hashtags |
| Photo cards | Rounded-2xl corners, glass overlay on hover, smooth scale transition |
| Upload modal | Full-screen drag-drop zone with upload progress bar |
| Auth page | Centered glass card on a gradient background |
| Search bar | Pill-shaped, dark bg, tag chips for hashtags |
| Admin panel | Dark table with alternating row highlights |

### Task 11.1 — Update global theme and root layout

**Files:**
- Modify: `app/styles/global.css`
- Modify: `app/root.tsx`
- Modify: `app/components/Navigation.tsx`

- [ ] Update `app/styles/global.css` with CSS variables and base dark theme.
- [ ] Configure `MantineProvider` in `root.tsx` with dark color scheme and custom theme:

```typescript
// In root.tsx
const theme = createTheme({
  colorScheme: "dark",
  primaryColor: "violet",
  defaultRadius: "md",
  fontFamily: "Inter, -apple-system, sans-serif",
  colors: {
    dark: ["#C1C2C5","#A6A7AB","#909296","#5c5f66","#373A40","#2C2E33","#25262b","#1A1B1E","#141517","#101113"],
  },
});
```

### Task 11.2 — Redesign PhotoCard component

**Files:**
- Modify: `app/modules/photos/components/PhotoCard.tsx`

- [ ] Replace existing PhotoCard with a glass-overlay hover card:

```tsx
// Key styles:
// - overflow: hidden, borderRadius: 12px
// - Image fills card with object-fit: cover
// - Hover: translateY(-4px) + box shadow elevation
// - Overlay: linear-gradient from transparent to rgba(0,0,0,0.8)
// - Show title + hashtag chips on hover only (opacity transition)
```

### Task 11.3 — Masonry photo grid

**Files:**
- Modify: `app/modules/photos/components/PhotoGrid.tsx`

- [ ] Replace MantineGrid with CSS masonry columns:

```tsx
// CSS approach (no extra library):
<div style={{
  columns: "var(--cols, 4)",
  gap: "12px",
  // responsive:
  "--cols": "2",  // mobile
  "@media (min-width: 768px)": { "--cols": "3" },
  "@media (min-width: 1200px)": { "--cols": "4" },
}}>
  {photos.map(photo => <PhotoCard key={photo.id} photo={photo} />)}
</div>
```

### Task 11.4 — Redesign Auth page

**Files:**
- Modify: `app/modules/auth/components/LoginForm.tsx`
- Modify: `app/modules/auth/components/RegisterForm.tsx`

- [ ] Wrap forms in a centered glass card with a radial gradient background:

```tsx
// Outer: min-height: 100vh, display: flex, align: center, 
//        background: radial-gradient(ellipse at top, #1e1b4b 0%, #0a0a0a 70%)
// Card: backdrop-filter: blur(20px), background: rgba(255,255,255,0.03),
//       border: 1px solid rgba(255,255,255,0.08), borderRadius: 24px,
//       padding: 48px, width: min(420px, 90vw)
```

### Task 11.5 — Redesign Upload modal

**Files:**
- Modify: `app/modules/photos/components/PhotoUploader.tsx`

- [ ] Add drag-and-drop zone with visual feedback:

```tsx
// Use @mantine/dropzone (already available in Mantine ecosystem)
// Large centered dashed-border area: "Drop images here or click to browse"
// On hover: border color → accent (#6366f1)
// On drag-over: background flash animation
// Progress bar below form on upload
```

- [ ] Run dev server and visually verify:

```bash
pnpm docker:up && pnpm dev
# Navigate to http://localhost:5173
```

- [ ] Commit:

```bash
git add app/
git commit -m "design: dark glassmorphism UI — masonry grid, glass cards, redesigned auth + upload"
```

---

## Phase 12 — Presentation Content (O1 + O4 + O7)

**Goal:** Prepare slide content for O1 (testing concepts), O4 (optimization methodology), and O7 (version control).  
**Effort:** M (2 hours)  
**Outcome:** O1, O4, O7

Create `docs/presentation-outline.md` with the following structure:

### Slide Deck Outline

```markdown
## Slide 1 — Project Overview
- Gallery app: tech stack, architecture diagram, feature list

## SECTION: O7 — Version Control (Slides 2-4)

### Slide 2 — Branching Strategy
- Diagram: main ← develop ← feature/* (Git Flow)
- Show git log --graph screenshot
- Explain merge strategy (squash merge to develop)

### Slide 3 — Commit History Demo
- Show example commits with semantic format
- Before/after: single blob commit vs. atomic commits
- PR description template

### Slide 4 — Branch Protection & CI
- List GitHub branch protection rules
- (Optional) Show CI workflow file

## SECTION: O1 — Advanced Testing Concepts (Slides 5-12)

### Slide 5 — Test Pyramid vs. Trophy
- Classic pyramid: unit > integration > e2e
- Kent C. Dodds "Testing Trophy": integration tests at center
- Why: unit tests test implementation, integration tests test behavior
- This project: 14 unit + 3 integration + 5 UI tests

### Slide 6 — Test Doubles
- **Mock**: Replaces a dependency with a controllable fake (vi.mock)
- **Stub**: Returns canned data (prisma.user.findUnique.mockResolvedValue)
- **Spy**: Wraps real implementation, records calls (vi.spyOn)
- **Fake**: Working implementation, lightweight (in-memory DB)
- Code example from PackageService tests

### Slide 7 — AAA Pattern
- Arrange: set up test doubles, inputs
- Act: call the unit under test
- Assert: verify outputs/state
- Code example from hashtag-parser.test.ts

### Slide 8 — Code Coverage
- Statement, Branch, Function, Line coverage
- Tool: @vitest/coverage-v8
- 100% is NOT the goal: aim for coverage on business logic
- Show coverage report screenshot

### Slide 9 — Mutation Testing
- What it is: automated tool mutates your code (flips == to !=, etc.)
- If tests still pass after mutation → tests are weak ("test that tests test nothing")
- Tool: Stryker (JS/TS) — not implemented here, but explain concept
- Metric: Mutation Score = killed mutants / total mutants

### Slide 10 — Property-Based Testing
- Traditional: fixed inputs → fixed outputs
- Property-based: generate 1000 random inputs, verify invariants hold
- Tool: fast-check (TS) — not implemented, but concept shown
- Example property: "parseHashtags always returns strings of length ≤ 50"

### Slide 11 — Test Isolation & Flaky Tests
- Test isolation: each test owns its state (beforeEach cleanDatabase)
- Flaky tests: tests that pass/fail randomly
- Causes: shared state, time-dependent behavior, async race conditions
- Prevention: deterministic seeds, fixed timestamps, wait-for patterns in Playwright

### Slide 12 — Contract Testing
- Consumer-Driven Contract Testing (Pact)
- Ensures API producer satisfies consumer expectations
- Not implemented here — explain why (monorepo, single team)
- Relevant when: microservices, multiple API consumers

## SECTION: O4 — Testing & Optimizing the Solution (Slides 13-16)

### Slide 13 — How the System is Tested
- Show test categories: unit (14), integration (3), UI (5)
- Show Vitest coverage report
- Show Playwright HTML report screenshot

### Slide 14 — Optimization 1: In-memory Caching
- Before: every search call = DB query
- After: @Cache(30_000) decorator, cache hit on repeated searches
- Benchmark numbers from Phase 10

### Slide 15 — Optimization 2: Parallel Image Storage
- Before: sequential store() calls
- After: Promise.all([original, thumbnail]) — ~2x speedup
- Code before/after + timing

### Slide 16 — Optimization 3: Metadata Reuse
- Before: sharp(buffer).metadata() called twice per upload
- After: cached to const, reused
- Show memory allocation savings

## SECTION: Architecture Summary (Slide 17)

### Slide 17 — Outcome Coverage Map
- Table showing each outcome and the concrete code artifact that satisfies it
```

---

## Deliverables Summary

### File/Folder Changes

```
gallery/
├── BRANCHING.md                                     NEW (O7)
├── Dockerfile                                       NEW (O8)
├── .dockerignore                                    NEW (O8)
├── docker-compose.yml                               MODIFIED (+app, prometheus, grafana)
├── playwright.config.ts                             NEW (O3)
├── vitest.config.ts                                 NEW (O2)
├── monitoring/
│   └── prometheus.yml                               NEW (O9)
├── benchmarks/
│   ├── hashtag-parser.bench.ts                      NEW (O4)
│   └── search-criteria.bench.ts                     NEW (O4)
├── tests/
│   ├── setup.ts                                     NEW (O2)
│   ├── unit/
│   │   ├── smoke.test.ts                            NEW (O2)
│   │   ├── images/
│   │   │   └── pipeline-builder.test.ts             NEW (O2)
│   │   └── photos/
│   │       ├── hashtag-parser.test.ts               NEW (O2)
│   │       └── package-service.test.ts              NEW (O2)
│   ├── integration/
│   │   ├── setup.ts                                 NEW (O3)
│   │   └── photo-repository.test.ts                 NEW (O3)
│   └── ui/
│       ├── auth.spec.ts                             NEW (O3)
│       ├── home.spec.ts                             NEW (O3)
│       └── .auth/user.json                          NEW
├── docs/
│   ├── optimizations.md                             NEW (O4)
│   └── presentation-outline.md                      NEW (O1/O4/O7)
└── app/
    ├── aspects/
    │   ├── log.decorator.ts                         NEW (O6)
    │   ├── perf.decorator.ts                        NEW (O6)
    │   ├── handle-errors.decorator.ts               NEW (O6)
    │   ├── cache.decorator.ts                       NEW (O6)
    │   └── index.ts                                 NEW (O6)
    ├── lib/
    │   ├── result.ts                                NEW (O5)
    │   └── metrics/
    │       └── metrics.ts                           NEW (O9)
    ├── routes/api/
    │   └── metrics.ts                               NEW (O9)
    └── modules/
        ├── images/
        │   ├── filters/
        │   │   └── filter-registry.ts               NEW (O8/OCP)
        │   └── services/
        │       └── image-processing-service.ts      MODIFIED (DIP, @Log, @Perf)
        ├── packages/
        │   ├── services/
        │   │   ├── usage-tracker.ts                 NEW (O8/SRP)
        │   │   └── capability-checker.ts            NEW (O8/SRP)
        │   └── utils/
        │       └── limit-checker.ts                 NEW (O5/Railway)
        └── photos/
            ├── repositories/
            │   └── photo-repository.ts              MODIFIED (@Log, @Cache, buildSearchWhere)
            ├── procedures/
            │   └── upload-photo.ts                  MODIFIED (fix static bug, use parseHashtags)
            └── utils/
                ├── hashtag-parser.ts                NEW (O5)
                ├── photo-mappers.ts                 NEW (O5)
                └── search-criteria-builder.ts       NEW (O5)
```

### New Packages to Install

```bash
# Testing
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  happy-dom @vitest/coverage-v8 vitest-mock-extended dotenv-cli
pnpm add -D @playwright/test

# Metrics
pnpm add prom-client

# (Optional) Drop zone for UI
pnpm add @mantine/dropzone
```

### Risk List

| Risk | Severity | Mitigation |
|------|----------|------------|
| TypeScript decorator ordering on static methods | M | Convert static methods to instance singleton pattern before applying decorators |
| `PhotoRepository.create()` static/instance bug | H | Fix in Phase 7 before integration tests run on `PhotoRepository.create` |
| Test database contaminating dev database | M | Use separate `gallery_test` DB + `cleanDatabase()` before each integration test |
| Playwright auth state stale between runs | L | Delete `tests/ui/.auth/user.json` and re-run auth setup if tests fail unexpectedly |
| `@Cache` decorator returns stale data in tests | M | Clear cache via exported `_cache.clear()` in test `afterEach` |
| `PackageService` SRP split breaks import paths | M | Use find+replace for imports after extracting `UsageTracker` and `CapabilityChecker` |
| Masonry CSS layout breaks on Firefox (no native CSS masonry) | L | Use CSS `columns` property (not grid masonry) — works cross-browser |
| Docker build fails if `pnpm build` requires DB | L | Run `db:generate` (not `db:migrate`) in Docker build stage |

### Presentation Outline

See `docs/presentation-outline.md` (Phase 12). Covers all O1, O4, O7 talking points in 17 slides.

---

## Outcome Coverage Checklist

| Outcome | Points | Phase(s) | Artifact |
|---------|--------|----------|----------|
| O1 — Testing concepts | 8 | 12 | `docs/presentation-outline.md` slides 5-12 |
| O2 — Unit tests | 8 | 2 | `tests/unit/` (14 tests) |
| O3 — Integration + UI | 8 | 3, 4 | `tests/integration/`, `tests/ui/` |
| O4 — Testing & optimizing | 8 | 10, 12 | `docs/optimizations.md`, benchmarks |
| O5 — Functional programming | 10 | 6 | `result.ts`, `search-criteria-builder.ts`, `photo-mappers.ts`, `limit-checker.ts`, `hashtag-parser.ts` |
| O6 — AOP | 10 | 5 | `app/aspects/` (4 decorators, 5+ usages) |
| O7 — Version control | 10 | 0 | `BRANCHING.md`, feature branches, commit log |
| O8 — SOLID + Docker | 10 | 7, 8 | Code refactors + `Dockerfile` + `docker-compose.yml` |
| O9 — Metrics | 10 | 9 | `app/lib/metrics/metrics.ts`, `/api/metrics` endpoint |
| **Total** | **82** | | |
