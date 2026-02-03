import { publicProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { PhotoRepository } from "../repositories/photo-repository";

// Validation schema for search
const searchPhotosSchema = v.object({
  hashtags: v.optional(v.array(v.string())),
  minSize: v.optional(v.number()),
  maxSize: v.optional(v.number()),
  dateFrom: v.optional(v.pipe(v.string(), v.isoDate())),
  dateTo: v.optional(v.pipe(v.string(), v.isoDate())),
  authorId: v.optional(v.string()),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
  offset: v.optional(v.pipe(v.number(), v.minValue(0))),
});

const photoRepository = new PhotoRepository();

export const searchPhotos = publicProcedure
  .input(searchPhotosSchema)
  .handler(async ({ input }) => {
    const photos = await photoRepository.search({
      hashtags: input.hashtags,
      minSize: input.minSize,
      maxSize: input.maxSize,
      dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
      authorId: input.authorId,
      limit: input.limit || 50,
      offset: input.offset || 0,
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
      criteria: {
        hashtags: input.hashtags,
        minSize: input.minSize,
        maxSize: input.maxSize,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        authorId: input.authorId,
      },
    };
  });
