import type { LoaderFunctionArgs } from "react-router";
import { PhotoRepository } from "~/modules/photos/repositories/photo-repository";

const photoRepository = new PhotoRepository();

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const userId = url.searchParams.get("userId") || undefined;

    const photos = await photoRepository.findMany({
      limit,
      offset,
      userId,
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
      limit,
      offset,
    });
  } catch (error) {
    console.error("List photos error:", error);
    return Response.json(
      { error: "Failed to load photos" },
      { status: 500 }
    );
  }
}
