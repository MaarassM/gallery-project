import { prisma } from "~/lib/db/client";

/**
 * Hashtag Service
 *
 * Handles hashtag parsing and management
 */

export class HashtagService {
  /**
   * Parse hashtags from text (e.g., "#nature #sunset")
   */
  static parseHashtags(text: string): string[] {
    const matches = text.match(/#[\w]+/g);
    if (!matches) return [];

    return matches.map((tag) => tag.slice(1).toLowerCase()).filter((tag) => tag.length > 0);
  }

  /**
   * Attach hashtags to a photo
   */
  static async attachHashtags(photoId: string, hashtags: string[]): Promise<void> {
    if (hashtags.length === 0) return;

    // Create or find hashtags
    const hashtagRecords = await Promise.all(
      hashtags.map(async (name) => {
        return await prisma.hashtag.upsert({
          where: { name },
          update: {},
          create: { name },
        });
      }),
    );

    // Link to photo
    await prisma.photoHashtag.createMany({
      data: hashtagRecords.map((hashtag) => ({
        photoId,
        hashtagId: hashtag.id,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Update photo hashtags (remove old, add new)
   */
  static async updatePhotoHashtags(photoId: string, hashtags: string[]): Promise<void> {
    // Remove existing links
    await prisma.photoHashtag.deleteMany({
      where: { photoId },
    });

    // Add new ones
    await this.attachHashtags(photoId, hashtags);
  }
}
