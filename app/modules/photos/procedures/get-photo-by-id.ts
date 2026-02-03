import { publicProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { PhotoRepository } from "../repositories/photo-repository";
import { AuditService } from "~/modules/audit/services/audit-service";

// Validation schema for getting photo by ID
const getPhotoByIdSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
});

const photoRepository = new PhotoRepository();

export const getPhotoById = publicProcedure
  .input(getPhotoByIdSchema)
  .handler(async ({ input, context }) => {
    const photo = await photoRepository.findById(input.id);

    if (!photo) {
      throw new Error("Photo not found");
    }

    // Increment view count
    await photoRepository.incrementViewCount(input.id);

    // Log view action (anonymous or authenticated)
    const user = context.user || null;
    await AuditService.log({
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role || "ANONYMOUS",
      action: "VIEW_PHOTO",
      resource: "photo",
      resourceId: photo.id,
      metadata: {
        photoId: photo.id,
        photoTitle: photo.title,
      },
      success: true,
    });

    return {
      success: true,
      photo: {
        id: photo.id,
        title: photo.title,
        description: photo.description,
        originalName: photo.originalName,
        storagePath: photo.storagePath,
        thumbnailPath: photo.thumbnailPath,
        mimeType: photo.mimeType,
        format: photo.format,
        width: photo.width,
        height: photo.height,
        sizeBytes: photo.sizeBytes,
        hashtags: photo.hashtags.map((pt) => pt.hashtag.name),
        processingOptions: photo.processingOptions,
        author: {
          id: photo.user.id,
          name: photo.user.name,
          email: photo.user.email,
        },
        viewCount: photo.viewCount + 1, // Include the incremented count
        downloadCount: photo.downloadCount,
        uploadedAt: photo.uploadedAt,
        updatedAt: photo.updatedAt,
      },
    };
  });
