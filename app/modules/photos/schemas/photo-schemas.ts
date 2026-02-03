import * as v from "valibot";

/**
 * Valibot Schemas for Photo Operations
 */

export const UploadPhotoSchema = v.object({
  title: v.optional(v.pipe(v.string(), v.maxLength(200))),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  hashtags: v.optional(v.array(v.pipe(v.string(), v.regex(/^[a-z0-9_]+$/)))),
  processing: v.optional(
    v.object({
      resize: v.optional(
        v.object({
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
      format: v.optional(v.picklist(["jpg", "png", "bmp"])),
    }),
  ),
});

export const UpdatePhotoSchema = v.object({
  photoId: v.pipe(v.string(), v.minLength(1)),
  title: v.optional(v.pipe(v.string(), v.maxLength(200))),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  hashtags: v.optional(v.array(v.pipe(v.string(), v.regex(/^[a-z0-9_]+$/)))),
});

export const SearchPhotosSchema = v.object({
  hashtags: v.optional(v.array(v.string())),
  minSize: v.optional(v.number()),
  maxSize: v.optional(v.number()),
  dateFrom: v.optional(v.pipe(v.string(), v.isoDate())),
  dateTo: v.optional(v.pipe(v.string(), v.isoDate())),
  authorId: v.optional(v.string()),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
  offset: v.optional(v.pipe(v.number(), v.minValue(0))),
});

export const DownloadPhotoSchema = v.object({
  photoId: v.pipe(v.string(), v.minLength(1)),
  filters: v.optional(
    v.object({
      resize: v.optional(
        v.object({
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
      filter: v.optional(v.picklist(["sepia", "blur", "grayscale", "sharpen"])),
      format: v.optional(v.picklist(["jpg", "png", "bmp"])),
      quality: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
    }),
  ),
});

export const GetPhotosSchema = v.object({
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(50))),
  offset: v.optional(v.pipe(v.number(), v.minValue(0))),
  myPhotosOnly: v.optional(v.boolean()),
});

export const PhotoIdSchema = v.object({
  photoId: v.pipe(v.string(), v.minLength(1)),
});
