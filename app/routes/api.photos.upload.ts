import type { ActionFunctionArgs } from "react-router";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";
import { PhotoRepository } from "~/modules/photos/repositories/photo-repository";
import { imageProcessingService } from "~/modules/images/services/image-processing-service";
import { PackageService } from "~/modules/packages/services/package-service";
import { auditService } from "~/modules/audit/services/audit-service";
import { photosUploadedTotal } from "~/lib/metrics/metrics";

const photoRepository = new PhotoRepository();

export async function action({ request }: ActionFunctionArgs) {
  console.log("=== UPLOAD PHOTO ACTION ===");

  try {
    // Check authentication
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies.session;
    const user = await getSessionUser(sessionToken);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const hashtags = formData.get("hashtags") as string;
    const processingOptions = formData.get("processingOptions")
      ? JSON.parse(formData.get("processingOptions") as string)
      : undefined;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Check package limits
    await PackageService.checkUploadLimit(user.id);

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/bmp", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Only JPG, PNG, BMP, and WEBP are allowed." },
        { status: 400 }
      );
    }

    const userPackage = await PackageService.getUserPackage(user.id);
    const maxSizeBytes = userPackage.maxPhotoSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return Response.json(
        { error: `File size exceeds package limit of ${userPackage.maxPhotoSizeMB}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image
    const processed = await imageProcessingService.processUpload(
      buffer,
      file.name,
      processingOptions
    );

    // Parse hashtags
    const hashtagArray = hashtags
      ? hashtags
          .split(",")
          .map((tag) => tag.trim().replace(/^#/, ""))
          .filter((tag) => tag.length > 0 && tag.length <= 50)
      : [];

    // Save photo to database
    const photo = await photoRepository.create({
      userId: user.id,
      originalName: file.name,
      storagePath: processed.storagePath,
      thumbnailPath: processed.thumbnailPath,
      mimeType: file.type,
      format: processed.metadata.format,
      sizeBytes: processed.metadata.size,
      width: processed.metadata.width,
      height: processed.metadata.height,
      title: title || null,
      description: description || null,
      hashtags: hashtagArray,
      processingOptions: processingOptions || null,
    });

    // Track usage
    await PackageService.trackUpload(user.id, processed.metadata.size / 1024 / 1024);

    // Increment Prometheus counter, segmented by package type
    photosUploadedTotal.inc({ package_type: userPackage.type ?? "unknown" });

    // Audit log
    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: (user as any).role || "REGISTERED",
      action: "UPLOAD_PHOTO",
      resource: "photo",
      resourceId: photo.id,
      metadata: {
        photoId: photo.id,
        originalName: file.name,
        sizeBytes: processed.metadata.size,
        hashtags: hashtagArray,
      },
      success: true,
    });

    console.log("Photo uploaded successfully:", photo.id);

    return Response.json({
      success: true,
      photo: {
        id: photo.id,
        title: photo.title,
        thumbnailPath: photo.thumbnailPath,
        uploadedAt: photo.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
