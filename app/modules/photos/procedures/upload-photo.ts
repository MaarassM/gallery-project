import { authedProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { PhotoRepository } from "../repositories/photo-repository";
import { ImageProcessingService } from "~/modules/images/services/image-processing-service";
import { PackageService } from "~/modules/packages/services/package-service";
import { AuditService } from "~/modules/audit/services/audit-service";

// Validation schema for photo upload
const uploadPhotoSchema = v.object({
  file: v.custom<File>(
    (val) => val instanceof File,
    "Must be a valid file"
  ),
  title: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  hashtags: v.optional(v.string()), // comma-separated hashtags
  processingOptions: v.optional(
    v.object({
      resize: v.optional(
        v.object({
          width: v.optional(v.number()),
          height: v.optional(v.number()),
          fit: v.optional(v.union([v.literal("cover"), v.literal("contain")])),
        })
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
    })
  ),
});

export const uploadPhoto = authedProcedure
  .input(uploadPhotoSchema)
  .handler(async ({ input, context }) => {
    const { user } = context;
    const { file, title, description, hashtags, processingOptions } = input;

    try {
      // 1. Check package limits
      await PackageService.checkUploadLimit(user.id);

      // 2. Validate file
      const allowedTypes = ["image/jpeg", "image/png", "image/bmp", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Invalid file type. Only JPG, PNG, BMP, and WEBP are allowed.");
      }

      // Get package to check size limit
      const userPackage = await PackageService.getUserPackage(user.id);
      const maxSizeBytes = userPackage.maxPhotoSizeMB * 1024 * 1024;

      if (file.size > maxSizeBytes) {
        throw new Error(
          `File size exceeds package limit of ${userPackage.maxPhotoSizeMB}MB`
        );
      }

      // 3. Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // 4. Process image (resize, convert format, generate thumbnail)
      const processed = await ImageProcessingService.processUpload(
        buffer,
        file.name,
        processingOptions
      );

      // 5. Parse hashtags
      const hashtagArray = hashtags
        ? hashtags
            .split(",")
            .map((tag) => tag.trim().replace(/^#/, ""))
            .filter((tag) => tag.length > 0 && tag.length <= 50)
        : [];

      // 6. Save photo to database
      const photo = await PhotoRepository.create({
        userId: user.id,
        originalName: file.name,
        storagePath: processed.storagePath,
        thumbnailPath: processed.thumbnailPath,
        mimeType: file.type,
        format: processed.metadata.format,
        sizeBytes: processed.metadata.size,
        width: processed.metadata.width,
        height: processed.metadata.height,
        title: title || null,
        description: description || null,
        hashtags: hashtagArray,
        processingOptions: processingOptions || null,
      });

      // 7. Track usage
      await PackageService.trackUpload(user.id, processed.metadata.size);

      // 8. Audit log
      await AuditService.log({
        userId: user.id,
        userEmail: user.email || undefined,
        userRole: user.role,
        action: "UPLOAD_PHOTO",
        resource: "photo",
        resourceId: photo.id,
        metadata: {
          photoId: photo.id,
          originalName: file.name,
          sizeBytes: processed.metadata.size,
          hashtags: hashtagArray,
        },
        success: true,
      });

      return {
        success: true,
        photo: {
          id: photo.id,
          title: photo.title,
          thumbnailPath: photo.thumbnailPath,
          uploadedAt: photo.uploadedAt,
        },
      };
    } catch (error) {
      // Audit log failure
      await AuditService.log({
        userId: user.id,
        userEmail: user.email || undefined,
        userRole: user.role,
        action: "UPLOAD_PHOTO",
        resource: "photo",
        metadata: {
          originalName: file.name,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
        errorMsg: error instanceof Error ? error.message : "Upload failed",
      });

      throw error;
    }
  });
