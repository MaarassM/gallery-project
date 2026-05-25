# SOLID Principles — Before/After Examples

Each principle below references specific files in this codebase with concrete before/after code.

---

## S — Single Responsibility Principle (SRP)

**One class should have only one reason to change.**

### Before
`app/modules/packages/services/package-service.ts` had **three responsibilities**:
1. Fetching package config (`getPackage`, `getUserPackage`)
2. Enforcing upload limits (`checkUploadLimit`)
3. Tracking usage mutations (`trackUpload`, `trackDownload`)
4. Querying user capabilities (`canDownloadOriginal`, `canApplyFilters`, `getMaxFilters`)

Any change to limit logic, tracking logic, or capability logic required editing the same class.

### After
Limit validation extracted to **pure functions** in `app/modules/packages/utils/limit-checker.ts`:

```typescript
// BEFORE: PackageService.checkUploadLimit throws exceptions imperatively
static async checkUploadLimit(userId: string): Promise<void> {
  const pkg = await this.getPackage(user.packageType);
  if (pkg.maxPhotosPerMonth !== -1) {
    const uploaded = usage?.photosUploaded || 0;
    if (uploaded >= pkg.maxPhotosPerMonth) {
      throw new Error(`Monthly upload limit reached ...`);
    }
  }
  // ... more if statements
}

// AFTER: limit-checker.ts — pure functions, no side effects
export function checkMonthlyPhotoLimit(pkg, usage): Result<void, string> {
  if (pkg.maxPhotosPerMonth === -1) return Result.ok(undefined);
  const uploaded = usage?.photosUploaded ?? 0;
  if (uploaded >= pkg.maxPhotosPerMonth)
    return Result.err(`Monthly upload limit reached (${pkg.maxPhotosPerMonth} photos)`);
  return Result.ok(undefined);
}
```

Each function has one reason to change: the business rule it encodes.

---

## O — Open/Closed Principle (OCP)

**Open for extension, closed for modification.**

### Before
`app/modules/images/processors/sharp-processor.ts` applied filters via a hardcoded `if/else` chain:

```typescript
// BEFORE: adding "vignette" filter = editing SharpProcessor source
if (opts.filter === "sepia") pipeline.recomb([...]);
else if (opts.filter === "blur") pipeline.blur(3);
else if (opts.filter === "grayscale") pipeline.grayscale();
else if (opts.filter === "sharpen") pipeline.sharpen();
// No way to add a filter without modifying this file
```

### After
`app/modules/images/filters/filter-registry.ts` introduces an open extension point:

```typescript
// AFTER: register a new filter without touching any existing code
import { registerFilter } from "~/modules/images/filters/filter-registry";

registerFilter("vignette", (pipeline) =>
  pipeline.composite([{ input: Buffer.from(...), blend: "multiply" }])
);
```

SharpProcessor never changes — it delegates to the registry.

---

## L — Liskov Substitution Principle (LSP)

**Subtypes must be substitutable for their base types.**

### Before
`CloudStorageStrategy` violated LSP — substituting it for `LocalStorageStrategy` crashed the app:

```typescript
// BEFORE: cloud-storage-strategy.ts — all methods threw
async store(): Promise<string> {
  throw new Error("Cloud storage not implemented yet"); // breaks contract
}
async retrieve(): Promise<Buffer> {
  throw new Error("Cloud storage not implemented yet"); // breaks contract
}
```

### After
`cloud-storage-strategy.ts` now returns safe stub values. Any code using `StorageStrategy` can swap implementations without crashing:

```typescript
// AFTER: safe stubs, contract-compliant
async store(_buffer, category): Promise<string> {
  return `cloud://${category}/${Date.now()}-stub.jpg`; // valid path string
}
async delete(_path): Promise<void> { } // idempotent no-op — as per contract
async exists(_path): Promise<boolean> { return false; } // never throws
```

The `StorageStrategy` interface now documents the contracts explicitly with JSDoc.

---

## D — Dependency Inversion Principle (DIP)

**High-level modules should not depend on low-level modules. Both should depend on abstractions.**

### Before
`ImageProcessingService` directly instantiated `LocalStorageStrategy` — a low-level detail:

```typescript
// BEFORE: image-processing-service.ts:27
export class ImageProcessingService {
  private static storage = new LocalStorageStrategy(); // hardcoded dependency
  // Cannot swap storage without editing this file
}
```

### After
`StorageStrategy` is injected via constructor — the class depends on the abstraction:

```typescript
// AFTER: image-processing-service.ts
export class ImageProcessingService {
  constructor(private storage: StorageStrategy = new LocalStorageStrategy()) {}
  // In tests: new ImageProcessingService(new MockStorage())
  // In production: new ImageProcessingService(new CloudStorageStrategy())
}
```

The singleton `imageProcessingService` uses the default, but callers can inject alternatives.

---

## I — Interface Segregation Principle (ISP)

**Clients should not be forced to depend on interfaces they do not use.**

The `StorageStrategy` interface defines exactly 4 methods — `store`, `retrieve`, `delete`, `exists`. No unrelated methods are bundled in. Any class that only needs to read storage implements only `retrieve` + `exists` without being forced to implement write operations.

This is satisfied by the current design: TypeScript structural typing allows partial implementations where only the needed methods are called.
