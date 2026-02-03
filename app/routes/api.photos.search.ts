import type { LoaderFunctionArgs } from "react-router";
import { PhotoRepository } from "~/modules/photos/repositories/photo-repository";

const photoRepository = new PhotoRepository();

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);

    // Parse query parameters
    const hashtags = url.searchParams.get("hashtags")
      ? url.searchParams.get("hashtags")!.split(",").map((t) => t.trim())
      : undefined;

    const minSize = url.searchParams.get("minSize")
      ? parseInt(url.searchParams.get("minSize")!)
      : undefined;

    const maxSize = url.searchParams.get("maxSize")
      ? parseInt(url.searchParams.get("maxSize")!)
      : undefined;

    const dateFrom = url.searchParams.get("dateFrom")
      ? new Date(url.searchParams.get("dateFrom")!)
      : undefined;

    const dateTo = url.searchParams.get("dateTo")
      ? new Date(url.searchParams.get("dateTo")!)
      : undefined;

    const authorId = url.searchParams.get("authorId") || undefined;

    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Search photos
    const photos = await photoRepository.search({
      hashtags,
      minSize,
      maxSize,
      dateFrom,
      dateTo,
      authorId,
      limit,
      offset,
    });

    return Response.json({
      success: true,
      photos: photos.map((photo) => ({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        thumbnailPath: photo.thumbnailPath,
        width: photo.width,
        height: photo.height,
        sizeBytes: photo.sizeBytes,
        format: photo.format,
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
      filters: {
        hashtags,
        minSize,
        maxSize,
        dateFrom,
        dateTo,
        authorId,
      },
      limit,
      offset,
    });
  } catch (error) {
    console.error("Search photos error:", error);
    return Response.json(
      { error: "Failed to search photos" },
      { status: 500 }
    );
  }
}
