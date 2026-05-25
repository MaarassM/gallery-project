// FP REFACTOR #4: Railway-Oriented Programming for upload limit validation.
//
// BEFORE (PackageService.checkUploadLimit): throws exceptions for all error cases,
//   mixing control flow (throw) with business logic. Callers must use try/catch.
//
// AFTER: Returns Result<void, string>. Callers handle the error path explicitly.
//   Pure functions: checkMonthlyPhotoLimit and checkStorageLimit have no side effects.
//   combineResults: higher-order function that merges multiple Results.

import { Result } from "~/lib/result";
import type { Package, UsageTracking } from "@prisma/client";

export function checkMonthlyPhotoLimit(
  pkg: Package,
  usage: UsageTracking | null,
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
  usage: UsageTracking | null,
): Result<void, string> {
  if (pkg.maxStorageGB === -1) return Result.ok(undefined);
  const usedGB = (usage?.storageUsedMB ?? 0) / 1024;
  if (usedGB >= pkg.maxStorageGB) {
    return Result.err(
      `Storage limit reached (${pkg.maxStorageGB}GB). Delete photos or upgrade.`,
    );
  }
  return Result.ok(undefined);
}

// HOF: combines multiple Result<void> checks — returns first error found, or Ok
export function combineResults(...results: Result<void, string>[]): Result<void, string> {
  const firstError = results.find(Result.isErr);
  return firstError ?? Result.ok(undefined);
}
