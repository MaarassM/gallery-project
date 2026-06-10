import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { PhotoRepository } from "~/modules/photos/repositories/photo-repository";
import { auditService } from "~/modules/audit/services/audit-service";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";
import fs from "fs/promises";
import path from "path";

const photoRepository = new PhotoRepository();

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const photoId = params.id;
    if (!photoId) {
      return Response.json(
        { error: "Photo ID is required" },
        { status: 400 }
      );
    }

    const photo = await photoRepository.findById(photoId);

    if (!photo) {
      return Response.json({ error: "Photo not found" }, { status: 404 });
    }

    // Increment view count
    await photoRepository.incrementViewCount(photoId);

    // Log view action
    const cookies = parseCookies(request.headers.get("cookie"));
    const user = await getSessionUser(cookies.session ?? null);
    await auditService.log({
      userId: user?.id,
      userEmail: user?.email || "anonymous",
      userRole: user?.role || "ANONYMOUS",
      action: "VIEW_PHOTO",
      resource: "Photo",
      resourceId: photoId,
      success: true,
    });

    return Response.json({
      success: true,
      photo: {
        id: photo.id,
        title: photo.title,
        description: photo.description,
        originalPath: photo.storagePath,
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
        viewCount: photo.viewCount + 1,
        downloadCount: photo.downloadCount,
        uploadedAt: photo.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Get photo error:", error);
    return Response.json(
      { error: "Failed to load photo" },
      { status: 500 }
    );
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const photoId = params.id;
    if (!photoId) {
      return Response.json({ error: "Photo ID is required" }, { status: 400 });
    }

    // Check authentication
    const cookies = parseCookies(request.headers.get("cookie"));
    const user = await getSessionUser(cookies.session ?? null);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = user.role;
    if (userRole !== "ADMINISTRATOR") {
      return Response.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Get photo to delete files
    const photo = await photoRepository.findById(photoId);
    if (!photo) {
      return Response.json({ error: "Photo not found" }, { status: 404 });
    }

    // Delete files from storage
    const storagePath = path.join(process.cwd(), "public", "storage");
    try {
      await fs.unlink(path.join(storagePath, photo.storagePath));
      await fs.unlink(path.join(storagePath, photo.thumbnailPath));
    } catch (fileError) {
      console.warn("Could not delete files:", fileError);
    }

    // Delete from database
    await photoRepository.delete(photoId);

    // Log delete action
    await auditService.log({
      userId: user.id,
      userEmail: user.email || "unknown",
      userRole: userRole,
      action: "DELETE_PHOTO",
      resource: "Photo",
      resourceId: photoId,
      success: true,
    });

    return Response.json({ success: true, message: "Photo deleted" });
  } catch (error) {
    console.error("Delete photo error:", error);
    return Response.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
