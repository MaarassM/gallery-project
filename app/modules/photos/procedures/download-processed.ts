import { authedProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { PhotoRepository } from "../repositories/photo-repository";
import { PackageService } from "~/modules/packages/services/package-service";
import { imageProcessingService } from "~/modules/images/services/image-processing-service";
import { auditService } from "~/modules/audit/services/audit-service";

// Validation schema for downloading processed photo
const downloadProcessedSchema = v.object({
  photoId: v.pipe(v.string(), v.minLength(1)),
  processingOptions: v.object({
    resize: v.optional(
      v.object({
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        fit: v.optional(v.union([v.literal("cover"), v.literal("contain")])),
      })
    ),
    filter: v.optional(
      v.union([
        v.literal("sepia"),
        v.literal("blur"),
        v.literal("grayscale"),
        v.literal("sharpen"),
      ])
    ),
    format: v.optional(
      v.union([
        v.literal("jpg"),
        v.literal("png"),
        v.literal("bmp"),
        v.literal("webp"),
      ])
    ),
    quality: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
  }),
});

const photoRepository = new PhotoRepository();

export const downloadProcessed = authedProcedure
  .input(downloadProcessedSchema)
  .handler(async ({ input, context }) => {
    const { user } = context;

    try {
      // 1. Check if user can apply filters
      const canApplyFilters = await PackageService.canApplyFilters(user.id);
      if (!canApplyFilters) {
        throw new Error(
          "Your package does not allow applying filters. Please upgrade to PRO or GOLD."
        );
      }

      // 2. Count filters being applied
      const filterCount = [
        input.processingOptions.resize,
        input.processingOptions.filter,
        input.processingOptions.format,
      ].filter(Boolean).length;

      // 3. Check filter limit
      const userPackage = await PackageService.getUserPackage(user.id);
      if (
        userPackage.maxFiltersPerDownload !== -1 &&
        filterCount > userPackage.maxFiltersPerDownload
      ) {
        throw new Error(
          `Your package allows maximum ${userPackage.maxFiltersPerDownload} filters per download. You're trying to apply ${filterCount} filters.`
        );
      }

      // 4. Get photo
      const photo = await photoRepository.findById(input.photoId);
      if (!photo) {
        throw new Error("Photo not found");
      }

      // 5. Retrieve original file from storage
      const originalBuffer = await imageProcessingService.retrieve(
        photo.storagePath
      );

      // 6. Process image with filters
      const processed = await imageProcessingService.processDownload(
        originalBuffer,
        photo.originalName,
        input.processingOptions
      );

      // 7. Increment download count
      await photoRepository.incrementDownloadCount(input.photoId);

      // 8. Track download
      await PackageService.trackDownload(user.id);

      // 9. Audit log
      await auditService.log({
        userId: user.id,
        userEmail: user.email || undefined,
        userRole: user.role,
        action: "DOWNLOAD_PROCESSED",
        resource: "photo",
        resourceId: photo.id,
        metadata: {
          photoId: photo.id,
          photoTitle: photo.title,
          originalName: photo.originalName,
          processingOptions: input.processingOptions,
          filterCount,
        },
        success: true,
      });

      return {
        success: true,
        file: {
          buffer: processed.buffer,
          filename: processed.filename,
          mimeType: processed.mimeType,
          size: processed.size,
        },
      };
    } catch (error) {
      // Audit log failure
      await auditService.log({
        userId: user.id,
        userEmail: user.email || undefined,
        userRole: user.role,
        action: "DOWNLOAD_PROCESSED",
        resource: "photo",
        resourceId: input.photoId,
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          processingOptions: input.processingOptions,
        },
        success: false,
        errorMsg: error instanceof Error ? error.message : "Download failed",
      });

      throw error;
    }
  });
