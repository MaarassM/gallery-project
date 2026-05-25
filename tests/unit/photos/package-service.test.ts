// Unit test for PackageService — uses vi.mock to isolate from the database.
// Test double pattern: mock replaces Prisma (external dependency).
// Compare with integration test: mocks verify logic; integration tests verify SQL.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/lib/db/client", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    package: { findUnique: vi.fn() },
    usageTracking: { findUnique: vi.fn() },
  },
}));

import { PackageService } from "~/modules/packages/services/package-service";
import { prisma } from "~/lib/db/client";

describe("PackageService.checkUploadLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when user is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(PackageService.checkUploadLimit("unknown-id")).rejects.toThrow(
      "User not found",
    );
  });

  it("throws when monthly photo limit is reached", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      packageType: "FREE",
    } as never);
    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      type: "FREE",
      maxPhotosPerMonth: 10,
      maxStorageGB: 1,
    } as never);
    vi.mocked(prisma.usageTracking.findUnique).mockResolvedValue({
      photosUploaded: 10,
      storageUsedMB: 0,
    } as never);

    await expect(PackageService.checkUploadLimit("u1")).rejects.toThrow(
      "Monthly upload limit reached",
    );
  });

  it("throws when storage limit is reached", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      packageType: "FREE",
    } as never);
    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      type: "FREE",
      maxPhotosPerMonth: 10,
      maxStorageGB: 1,
    } as never);
    vi.mocked(prisma.usageTracking.findUnique).mockResolvedValue({
      photosUploaded: 0,
      storageUsedMB: 1024, // exactly 1GB
    } as never);

    await expect(PackageService.checkUploadLimit("u1")).rejects.toThrow(
      "Storage limit reached",
    );
  });

  it("does not throw when limit is -1 (GOLD unlimited)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      packageType: "GOLD",
    } as never);
    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      type: "GOLD",
      maxPhotosPerMonth: -1,
      maxStorageGB: -1,
    } as never);
    vi.mocked(prisma.usageTracking.findUnique).mockResolvedValue(null);

    await expect(
      PackageService.checkUploadLimit("u1"),
    ).resolves.toBeUndefined();
  });

  it("does not throw when usage is below limit", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      packageType: "PRO",
    } as never);
    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      type: "PRO",
      maxPhotosPerMonth: 100,
      maxStorageGB: 10,
    } as never);
    vi.mocked(prisma.usageTracking.findUnique).mockResolvedValue({
      photosUploaded: 42,
      storageUsedMB: 512,
    } as never);

    await expect(
      PackageService.checkUploadLimit("u1"),
    ).resolves.toBeUndefined();
  });
});
