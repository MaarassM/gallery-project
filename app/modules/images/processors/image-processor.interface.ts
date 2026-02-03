/**
 * Image Processor Interface
 *
 * Defines contract for all image processors
 */

export type ProcessingOptions = {
  resize?: {
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  };
  filter?: "sepia" | "blur" | "grayscale" | "sharpen";
  format?: "jpg" | "png" | "bmp" | "webp";
  quality?: number;
};

export type ImageProcessor = {
  process(input: Buffer, options: ProcessingOptions): Promise<Buffer>;
};
