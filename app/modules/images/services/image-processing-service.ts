import sharp from "sharp";
import { ImagePipelineBuilder } from "../pipelines/pipeline-builder";
import { LocalStorageStrategy } from "../strategies/local-storage-strategy";
import type { StorageStrategy } from "../strategies/storage-strategy.interface";
import type { ProcessingOptions } from "../processors/image-processor.interface";
import { Log, Perf } from "~/aspects";
import { activeImageProcessing } from "~/lib/metrics/metrics";

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

// DIP: StorageStrategy is injected, not hardcoded. Defaults to LocalStorageStrategy.
// Converted from static to instance methods to support AOP decorators.
export class ImageProcessingService {
  constructor(private storage: StorageStrategy = new LocalStorageStrategy()) {}

  @Log("imageProcessingService.processUpload")
  @Perf(100)
  async processUpload(
    fileBuffer: Buffer,
    originalFilename: string,
    options?: ProcessUploadOptions,
  ): Promise<ProcessUploadResult> {
    activeImageProcessing.inc();
    try {
    const initialMetadata = await sharp(fileBuffer).metadata();

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

    const thumbnailBuffer = await new ImagePipelineBuilder()
      .withResize(250, 250, "cover")
      .withFormat("jpg", 80)
      .build()
      .execute(fileBuffer);

    const [storagePath, thumbnailPath] = await Promise.all([
      this.storage.store(processedBuffer, "originals"),
      this.storage.store(thumbnailBuffer, "thumbnails"),
    ]);

    // Reuse initial metadata if no processing was applied, avoids a second sharp() call
    const finalMetadata =
      processedBuffer === fileBuffer
        ? initialMetadata
        : await sharp(processedBuffer).metadata();

    return {
      storagePath,
      thumbnailPath,
      metadata: {
        width: finalMetadata.width ?? initialMetadata.width ?? 0,
        height: finalMetadata.height ?? initialMetadata.height ?? 0,
        format: finalMetadata.format ?? initialMetadata.format ?? "unknown",
        size: processedBuffer.length,
      },
    };
    } finally {
      activeImageProcessing.dec();
    }
  }

  @Log("imageProcessingService.processDownload")
  @Perf(50)
  async processDownload(
    fileBuffer: Buffer,
    originalFilename: string,
    options: {
      resize?: { width: number; height: number; fit?: "cover" | "contain" | "fill" };
      filters?: string[];
      format?: string;
      quality?: number;
    },
  ): Promise<ProcessDownloadResult> {
    type BuilderTransform = (b: ImagePipelineBuilder) => ImagePipelineBuilder;

    const applyResize = (
      resize?: { width: number; height: number; fit?: "cover" | "contain" | "fill" },
    ): BuilderTransform =>
      (b) =>
        resize ? b.withResize(resize.width, resize.height, resize.fit as "cover" | "contain") : b;

    const applyFilters = (filters?: string[]): BuilderTransform =>
      (b) =>
        (filters ?? []).reduce(
          (acc, f) => acc.withFilter(f as "sepia" | "blur" | "grayscale" | "sharpen"),
          b,
        );

    const applyFormat = (format?: string, quality?: number): BuilderTransform =>
      (b) =>
        format ? b.withFormat(format as "jpg" | "png" | "bmp" | "webp", quality) : b;

    const transforms: BuilderTransform[] = [
      applyResize(options.resize),
      applyFilters(options.filters),
      applyFormat(options.format, options.quality),
    ];

    const builder = transforms.reduce(
      (b, transform) => transform(b),
      new ImagePipelineBuilder(),
    );

    const processedBuffer = await builder.build().execute(fileBuffer);

    const ext = options.format ?? originalFilename.split(".").pop() ?? "jpg";
    const basename = originalFilename.replace(/\.[^/.]+$/, "");
    const filename = `${basename}_processed.${ext}`;

    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      bmp: "image/bmp",
      webp: "image/webp",
    };

    return {
      buffer: processedBuffer,
      filename,
      mimeType: mimeTypes[ext] ?? "image/jpeg",
      sizeBytes: processedBuffer.length,
    };
  }

  async retrieve(storagePath: string): Promise<Buffer> {
    return await this.storage.retrieve(storagePath);
  }

  async getThumbnail(thumbnailPath: string): Promise<Buffer> {
    return await this.storage.retrieve(thumbnailPath);
  }

  async deletePhoto(storagePath: string, thumbnailPath: string): Promise<void> {
    await Promise.all([
      this.storage.delete(storagePath),
      this.storage.delete(thumbnailPath),
    ]);
  }
}

// Singleton instance used by procedures — allows DIP injection in tests
export const imageProcessingService = new ImageProcessingService();
