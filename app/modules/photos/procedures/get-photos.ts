import { publicProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { PhotoRepository } from "../repositories/photo-repository";

// Validation schema for listing photos
const getPhotosSchema = v.object({
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
  offset: v.optional(v.pipe(v.number(), v.minValue(0))),
  userId: v.optional(v.string()),
});

const photoRepository = new PhotoRepository();

export const getPhotos = publicProcedure
  .input(getPhotosSchema)
  .handler(async ({ input }) => {
    const photos = await photoRepository.findMany({
      limit: input.limit || 10,
      offset: input.offset || 0,
      userId: input.userId,
    });

    return {
      success: true,
      photos: photos.map((photo) => ({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        thumbnailPath: photo.thumbnailPath,
        width: photo.width,
        height: photo.height,
        sizeBytes: photo.sizeBytes,
        hashtags: photo.hashtags.map((pt) => pt.hashtag.name),
        author: {
          id: photo.user.id,
          name: photo.user.name,
          email: photo.user.email,
        },
        viewCount: photo.viewCount,
        downloadCount: photo.downloadCount,
        uploadedAt: photo.uploadedAt,
      })),
      total: photos.length,
      limit: input.limit || 10,
      offset: input.offset || 0,
    };
  });
