// FP REFACTOR #5: Replace inline 12-field .map() block with pure mapPhotoToDto HOF.
//
// BEFORE: 28 lines of inline photo.id, photo.title, ... photo.uploadedAt mapping
//   duplicated in every procedure that returns photos.
//
// AFTER: toPagedResponse(photos, mapPhotoToDto, meta) — single call, no repetition.
//   mapPhotoToDto is a pure function: easily tested, reused in get-photos.ts too.

import { publicProcedure } from "~/lib/orpc/middleware";
import * as v from "valibot";
import { PhotoRepository } from "../repositories/photo-repository";
import { mapPhotoToDto, toPagedResponse } from "../utils/photo-mappers";

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
      limit: input.limit ?? 50,
      offset: input.offset ?? 0,
    });

    return toPagedResponse(photos as never, mapPhotoToDto, {
      criteria: {
        hashtags: input.hashtags,
        minSize: input.minSize,
        maxSize: input.maxSize,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        authorId: input.authorId,
      },
    });
  });
