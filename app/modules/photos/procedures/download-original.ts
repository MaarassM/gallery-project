import { authedProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { PhotoRepository } from "../repositories/photo-repository";
import { PackageService } from "~/modules/packages/services/package-service";
import { imageProcessingService } from "~/modules/images/services/image-processing-service";
import { auditService } from "~/modules/audit/services/audit-service";

// Validation schema for downloading original photo
const downloadOriginalSchema = v.object({
  photoId: v.pipe(v.string(), v.minLength(1)),
});

const photoRepository = new PhotoRepository();

export const downloadOriginal = authedProcedure
  .input(downloadOriginalSchema)
  .handler(async ({ input, context }) => {
    const { user } = context;

    try {
      // 1. Check if user can download originals
      const canDownload = await PackageService.canDownloadOriginal(user.id);
      if (!canDownload) {
        throw new Error(
          "Your package does not allow downloading original photos. Please upgrade to PRO or GOLD."
        );
      }

      // 2. Get photo
      const photo = await photoRepository.findById(input.photoId);
      if (!photo) {
        throw new Error("Photo not found");
      }

      // 3. Retrieve file from storage
      const fileBuffer = await imageProcessingService.retrieve(
        photo.storagePath
      );

      // 4. Increment download count
      await photoRepository.incrementDownloadCount(input.photoId);

      // 5. Track download
      await PackageService.trackDownload(user.id);

      // 6. Audit log
      await auditService.log({
        userId: user.id,
        userEmail: user.email || undefined,
        userRole: user.role,
        action: "DOWNLOAD_ORIGINAL",
        resource: "photo",
        resourceId: photo.id,
        metadata: {
          photoId: photo.id,
          photoTitle: photo.title,
          originalName: photo.originalName,
        },
        success: true,
      });

      return {
        success: true,
        file: {
          buffer: fileBuffer,
          filename: photo.originalName,
          mimeType: photo.mimeType,
          size: photo.sizeBytes,
        },
      };
    } catch (error) {
      // Audit log failure
      await auditService.log({
        userId: user.id,
        userEmail: user.email || undefined,
        userRole: user.role,
        action: "DOWNLOAD_ORIGINAL",
        resource: "photo",
        resourceId: input.photoId,
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
        errorMsg: error instanceof Error ? error.message : "Download failed",
      });

      throw error;
    }
  });
