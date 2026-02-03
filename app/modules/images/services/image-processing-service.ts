import sharp from "sharp";
import { ImagePipelineBuilder } from "../pipelines/pipeline-builder";
import { LocalStorageStrategy } from "../strategies/local-storage-strategy";
import type { ProcessingOptions } from "../processors/image-processor.interface";

export type ProcessUploadOptions = ProcessingOptions;

export type ProcessUploadResult = {
  storagePath: string;
  thumbnailPath: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
};

export type ProcessDownloadResult = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

export class ImageProcessingService {
  private static storage = new LocalStorageStrategy();

  static async processUpload(
    fileBuffer: Buffer,
    originalFilename: string,
    options?: ProcessUploadOptions,
  ): Promise<ProcessUploadResult> {
    // Get original image metadata
    const metadata = await sharp(fileBuffer).metadata();

    // Apply user-requested processing to original
    let processedBuffer = fileBuffer;
    if (options) {
      const pipeline = new ImagePipelineBuilder();

      if (options.resize) {
        pipeline.withResize(
          options.resize.width,
          options.resize.height,
          options.resize.fit,
        );
      }

      if (options.filter) {
        pipeline.withFilter(options.filter);
      }

      if (options.format) {
        pipeline.withFormat(options.format, options.quality);
      }

      processedBuffer = await pipeline.build().execute(fileBuffer);
    }

    // Generate thumbnail (250x250)
    const thumbnailBuffer = await new ImagePipelineBuilder()
      .withResize(250, 250, "cover")
      .withFormat("jpg", 80)
      .build()
      .execute(fileBuffer);

    // Store both
    const [storagePath, thumbnailPath] = await Promise.all([
      this.storage.store(processedBuffer, "originals"),
      this.storage.store(thumbnailBuffer, "thumbnails"),
    ]);

    // Get final metadata after processing
    const finalMetadata = await sharp(processedBuffer).metadata();

    return {
      storagePath,
      thumbnailPath,
      metadata: {
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
        format: finalMetadata.format || "unknown",
        size: processedBuffer.length,
      },
    };
  }

  static async processDownload(
    fileBuffer: Buffer,
    originalFilename: string,
    options: {
      resize?: { width: number; height: number; fit?: "cover" | "contain" | "fill" };
      filters?: string[];
      format?: string;
      quality?: number;
    },
  ): Promise<ProcessDownloadResult> {
    // Apply filters using pipeline builder
    const builder = new ImagePipelineBuilder();

    if (options.resize) {
      builder.withResize(options.resize.width, options.resize.height, options.resize.fit);
    }

    // Apply multiple filters
    if (options.filters && options.filters.length > 0) {
      for (const filter of options.filters) {
        builder.withFilter(filter);
      }
    }

    let targetFormat = options.format;
    if (options.format) {
      builder.withFormat(options.format, options.quality);
    }

    // Execute pipeline
    const processedBuffer = await builder.build().execute(fileBuffer);

    // Determine output filename and mime type
    const ext = targetFormat || originalFilename.split('.').pop() || 'jpg';
    const basename = originalFilename.replace(/\.[^/.]+$/, "");
    const filename = `${basename}_processed.${ext}`;

    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      bmp: 'image/bmp',
      webp: 'image/webp',
    };

    return {
      buffer: processedBuffer,
      filename,
      mimeType: mimeTypes[ext] || 'image/jpeg',
      sizeBytes: processedBuffer.length,
    };
  }

  static async retrieve(storagePath: string): Promise<Buffer> {
    return await this.storage.retrieve(storagePath);
  }

  static async getThumbnail(thumbnailPath: string): Promise<Buffer> {
    return await this.storage.retrieve(thumbnailPath);
  }

  static async deletePhoto(storagePath: string, thumbnailPath: string): Promise<void> {
    await Promise.all([
      this.storage.delete(storagePath),
      this.storage.delete(thumbnailPath),
    ]);
  }
}
