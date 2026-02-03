import type { LoaderFunctionArgs } from "react-router";
import { PhotoRepository } from "~/modules/photos/repositories/photo-repository";
import { PackageService } from "~/modules/packages/services/package-service";
import { AuditService } from "~/modules/audit/services/audit-service";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";
import { readFile } from "node:fs/promises";

const photoRepository = new PhotoRepository();

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    // Check authentication using custom auth
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies.session;
    const user = await getSessionUser(sessionToken);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Check if user's package allows downloading originals
    const canDownload = await PackageService.canDownloadOriginal(user.id);

    if (!canDownload) {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: (user as any).role || "REGISTERED",
        action: "DOWNLOAD_ORIGINAL_DENIED",
        resource: "Photo",
        resourceId: photoId,
        success: false,
        errorMsg: "Package does not allow downloading originals",
      });

      return Response.json(
        { error: "Your package does not allow downloading original photos. Upgrade to PRO or GOLD." },
        { status: 403 }
      );
    }

    // Read file
    const fileBuffer = await readFile(photo.storagePath);

    // Increment download count
    await photoRepository.incrementDownloadCount(photoId);

    // Log download
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: (user as any).role || "REGISTERED",
      action: "DOWNLOAD_ORIGINAL",
      resource: "Photo",
      resourceId: photoId,
      success: true,
    });

    // Return file
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": photo.mimeType,
        "Content-Disposition": `attachment; filename="${photo.originalName}"`,
        "Content-Length": photo.sizeBytes.toString(),
      },
    });
  } catch (error) {
    console.error("Download photo error:", error);
    return Response.json(
      { error: "Failed to download photo" },
      { status: 500 }
    );
  }
}
