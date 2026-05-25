// Integration test for PhotoRepository — hits real PostgreSQL.
// Compare with unit tests (tests/unit/photos/*): unit tests mock Prisma and verify
// business logic in isolation. Integration tests verify actual SQL behavior:
// JOINs, composite where clauses, upserts, and cascade relations.
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PhotoRepository } from "~/modules/photos/repositories/photo-repository";
import { testPrisma, cleanDatabase, seedTestUser } from "./setup";

const repo = new PhotoRepository();

const basePhoto = {
  userId: "test-user-id",
  originalName: "test.jpg",
  storagePath: "originals/test.jpg",
  thumbnailPath: "thumbnails/test.jpg",
  mimeType: "image/jpeg",
  format: "jpg",
  sizeBytes: 1024,
  width: 800,
  height: 600,
} as const;

describe("PhotoRepository (integration)", () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestUser();
    // seed the FREE package (required for user FK)
    await testPrisma.package.upsert({
      where: { type: "FREE" },
      update: {},
      create: {
        type: "FREE",
        name: "Free",
        maxPhotosPerMonth: 10,
        maxPhotoSizeMB: 5,
        maxStorageGB: 1,
        canDownloadOriginal: false,
        canApplyFilters: false,
        maxFiltersPerDownload: 0,
      },
    });
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("creates a photo with hashtags and retrieves it by id", async () => {
    const created = await repo.create({
      ...basePhoto,
      title: "Test photo",
      hashtags: ["nature", "travel"],
    });

    expect(created.id).toBeDefined();

    const found = await repo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe("Test photo");
    const tagNames = (found as any).hashtags.map((pt: any) => pt.hashtag.name);
    expect(tagNames).toContain("nature");
    expect(tagNames).toContain("travel");
  });

  it("re-uses existing hashtags on second photo (connectOrCreate)", async () => {
    await repo.create({ ...basePhoto, originalName: "a.jpg", storagePath: "originals/a.jpg", hashtags: ["nature"] });
    await repo.create({ ...basePhoto, originalName: "b.jpg", storagePath: "originals/b.jpg", hashtags: ["nature"] });

    const allHashtags = await testPrisma.hashtag.findMany({ where: { name: "nature" } });
    expect(allHashtags).toHaveLength(1);
  });

  it("filters photos by hashtag in search()", async () => {
    await repo.create({ ...basePhoto, originalName: "nature.jpg", storagePath: "originals/nature.jpg", hashtags: ["nature"] });
    await repo.create({ ...basePhoto, originalName: "urban.jpg", storagePath: "originals/urban.jpg", hashtags: ["urban"] });

    const results = await repo.search({ hashtags: ["nature"] });
    expect(results).toHaveLength(1);
    const tagNames = (results[0] as any).hashtags.map((pt: any) => pt.hashtag.name);
    expect(tagNames).toContain("nature");
  });

  it("filters photos by size range in search()", async () => {
    await repo.create({ ...basePhoto, originalName: "small.jpg", storagePath: "originals/small.jpg", sizeBytes: 100_000 });
    await repo.create({ ...basePhoto, originalName: "large.jpg", storagePath: "originals/large.jpg", sizeBytes: 5_000_000 });

    const results = await repo.search({ minSize: 1_000_000 });
    expect(results).toHaveLength(1);
    expect(results[0].sizeBytes).toBeGreaterThanOrEqual(1_000_000);
  });

  it("filters photos by date range in search()", async () => {
    const created = await repo.create({ ...basePhoto, originalName: "dated.jpg", storagePath: "originals/dated.jpg" });

    const yesterday = new Date(Date.now() - 86_400_000);
    const tomorrow = new Date(Date.now() + 86_400_000);

    const results = await repo.search({ dateFrom: yesterday, dateTo: tomorrow });
    expect(results.some((p) => p.id === created.id)).toBe(true);
  });

  it("increments viewCount", async () => {
    const created = await repo.create({ ...basePhoto, originalName: "view.jpg", storagePath: "originals/view.jpg" });
    await repo.incrementViewCount(created.id);
    const updated = await repo.findById(created.id);
    expect(updated!.viewCount).toBe(1);
  });

  it("deletes a photo", async () => {
    const created = await repo.create({ ...basePhoto, originalName: "del.jpg", storagePath: "originals/del.jpg" });
    await repo.delete(created.id);
    const found = await repo.findById(created.id);
    expect(found).toBeNull();
  });
});
