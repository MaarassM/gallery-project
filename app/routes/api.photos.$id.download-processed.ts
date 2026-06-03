import type { ActionFunctionArgs } from "react-router";
import { PhotoRepository } from "~/modules/photos/repositories/photo-repository";
import { imageProcessingService } from "~/modules/images/services/image-processing-service";
import { PackageService } from "~/modules/packages/services/package-service";
import { auditService } from "~/modules/audit/services/audit-service";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";
import { readFile } from "node:fs/promises";

const photoRepository = new PhotoRepository();

export async function action({ request, params }: ActionFunctionArgs) {
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

    // Parse processing options from request body
    const body = await request.json();
    const { resize, filters = [], format } = body;

    // Check if user's package allows applying filters
    const canApplyFilters = await PackageService.canApplyFilters(user.id);

    if (!canApplyFilters && (filters.length > 0 || resize || format)) {
      await auditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: (user as any).role || "REGISTERED",
        action: "DOWNLOAD_PROCESSED_DENIED",
        resource: "Photo",
        resourceId: photoId,
        success: false,
        errorMsg: "Package does not allow applying filters",
      });

      return Response.json(
        { error: "Your package does not allow applying filters. Upgrade to PRO or GOLD." },
        { status: 403 }
      );
    }

    // Check filter limits for user's package
    if (filters.length > 0) {
      const maxFilters = await PackageService.getMaxFilters(user.id);

      if (maxFilters !== -1 && filters.length > maxFilters) {
        return Response.json(
          { error: `Your package allows maximum ${maxFilters} filters per download.` },
          { status: 403 }
        );
      }
    }

    // Read original file
    const originalBuffer = await readFile(photo.storagePath);

    // Process image with requested options
    const processed = await imageProcessingService.processDownload(
      originalBuffer,
      photo.originalName,
      { resize, filters, format }
    );

    // Increment download count
    await photoRepository.incrementDownloadCount(photoId);

    // Log download
    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: (user as any).role || "REGISTERED",
      action: "DOWNLOAD_PROCESSED",
      resource: "Photo",
      resourceId: photoId,
      metadata: { resize, filters, format },
      success: true,
    });

    // Return processed file
    const extension = format || photo.format;
    const mimeType = `image/${extension}`;
    const filename = photo.originalName.replace(/\.[^.]+$/, `.${extension}`);

    return new Response(processed.buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": processed.sizeBytes.toString(),
      },
    });
  } catch (error) {
    console.error("Download processed photo error:", error);
    return Response.json(
      { error: "Failed to process and download photo" },
      { status: 500 }
    );
  }
}
