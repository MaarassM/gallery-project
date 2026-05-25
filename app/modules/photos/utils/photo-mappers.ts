// FP REFACTOR #3: Photo DTO mapper.
//
// BEFORE: Each procedure (search-photos.ts, get-photos.ts) had identical 12-field
//   inline .map() blocks — code duplicated across files.
//
// AFTER: mapPhotoToDto is a pure higher-order function (HOF).
//   toPagedResponse composes mapping + pagination into a single reusable function.
//   Pure: no side effects, same input always yields same output, easily testable.

import type { Photo } from "@prisma/client";

export type PhotoDto = {
  id: string;
  title: string | null;
  description: string | null;
  thumbnailPath: string;
  width: number;
  height: number;
  sizeBytes: number;
  hashtags: string[];
  author: { id: string; name: string | null; email: string | null };
  viewCount: number;
  downloadCount: number;
  uploadedAt: Date;
};

type PhotoWithRelations = Photo & {
  hashtags: Array<{ hashtag: { name: string } }>;
  user: { id: string; name: string | null; email: string | null };
};

// Pure transformation function — zero side effects
export function mapPhotoToDto(photo: PhotoWithRelations): PhotoDto {
  return {
    id: photo.id,
    title: photo.title,
    description: photo.description,
    thumbnailPath: photo.thumbnailPath,
    width: photo.width,
    height: photo.height,
    sizeBytes: photo.sizeBytes,
    hashtags: photo.hashtags.map((pt) => pt.hashtag.name),
    author: photo.user,
    viewCount: photo.viewCount,
    downloadCount: photo.downloadCount,
    uploadedAt: photo.uploadedAt,
  };
}

// Higher-order function: wraps any collection + mapper in a standard page response
export function toPagedResponse<T, U>(
  items: T[],
  mapper: (item: T) => U,
  meta?: Record<string, unknown>,
): { success: true; photos: U[]; total: number } & Record<string, unknown> {
  return {
    success: true,
    photos: items.map(mapper),
    total: items.length,
    ...meta,
  };
}
