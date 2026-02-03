import sharp from "sharp";
import type {
  ImageProcessor,
  ProcessingOptions,
} from "./image-processor.interface";

/**
 * Sharp-based Image Processor Implementation
 *
 * Uses Sharp library for high-performance image processing
 */

export class SharpProcessor implements ImageProcessor {
  async process(input: Buffer, options: ProcessingOptions): Promise<Buffer> {
    let pipeline = sharp(input);

    // Apply resize
    if (options.resize) {
      pipeline = pipeline.resize({
        width: options.resize.width,
        height: options.resize.height,
        fit: options.resize.fit || "cover",
      });
    }

    // Apply filters
    if (options.filter) {
      switch (options.filter) {
        case "sepia":
          pipeline = pipeline
            .modulate({ saturation: 0.5 })
            .tint({ r: 112, g: 66, b: 20 });
          break;
        case "blur":
          pipeline = pipeline.blur(5);
          break;
        case "grayscale":
          pipeline = pipeline.grayscale();
          break;
        case "sharpen":
          pipeline = pipeline.sharpen();
          break;
      }
    }

    // Apply format conversion
    if (options.format) {
      const quality = options.quality || 90;
      switch (options.format) {
        case "jpg":
          pipeline = pipeline.jpeg({ quality });
          break;
        case "png":
          pipeline = pipeline.png({ quality });
          break;
        case "webp":
          pipeline = pipeline.webp({ quality });
          break;
      }
    }

    return await pipeline.toBuffer();
  }
}
