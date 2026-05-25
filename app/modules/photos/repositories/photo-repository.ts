import { prisma } from "~/lib/db/client";
import type { Photo, Prisma } from "@prisma/client";
import { Log, Cache } from "~/aspects";
import { buildSearchWhere } from "../utils/search-criteria-builder";

// REPOSITORY PATTERN: Enkapsulira sve operacije nad bazom podataka za Photo entitet.
// Pruža interface sličan kolekciji (create, findById, findMany, search, update, delete).
// Izolira logiku pristupa podacima - poslovna logika ne zna za Prisma/SQL.

export type CreatePhotoInput = {
  userId: string;
  originalName: string;
  storagePath: string;
  thumbnailPath: string;
  mimeType: string;
  format: string;
  sizeBytes: number;
  width: number;
  height: number;
  title?: string | null;
  description?: string | null;
  hashtags?: string[];
  processingOptions?: Prisma.InputJsonValue | null;
};

export type SearchCriteria = {
  hashtags?: string[];
  minSize?: number;
  maxSize?: number;
  dateFrom?: Date;
  dateTo?: Date;
  authorId?: string;
  limit?: number;
  offset?: number;
};

export class PhotoRepository {
  async create(input: CreatePhotoInput): Promise<Photo> {
    const { hashtags, ...photoData } = input;

    // Kreiraj fotografiju s hashtagovima
    const photo = await prisma.photo.create({
      data: {
        ...photoData,
        hashtags: hashtags
          ? {
              create: hashtags.map((tagName) => ({
                hashtag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    return photo;
  }

  async findById(id: string): Promise<Photo | null> {
    return await prisma.photo.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        hashtags: { include: { hashtag: true } },
      },
    });
  }

  async findMany(options: { limit?: number; offset?: number; userId?: string }): Promise<Photo[]> {
    return await prisma.photo.findMany({
      where: options.userId ? { userId: options.userId } : undefined,
      take: options.limit || 10,
      skip: options.offset || 0,
      orderBy: { uploadedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        hashtags: { include: { hashtag: true } },
      },
    });
  }

  @Log()
  @Cache(30_000)
  async search(criteria: SearchCriteria): Promise<Photo[]> {
    // FP: buildSearchWhere composes pure filter functions instead of imperative if/else
    return await prisma.photo.findMany({
      where: buildSearchWhere(criteria),
      take: criteria.limit ?? 50,
      skip: criteria.offset ?? 0,
      orderBy: { uploadedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        hashtags: { include: { hashtag: true } },
      },
    });
  }

  async update(id: string, data: { title?: string; description?: string }): Promise<Photo> {
    return await prisma.photo.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.photo.delete({ where: { id } });
  }

  async incrementViewCount(id: string): Promise<void> {
    await prisma.photo.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await prisma.photo.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }
}
