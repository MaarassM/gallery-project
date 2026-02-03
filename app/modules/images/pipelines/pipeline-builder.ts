import type { ProcessingOptions } from "../processors/image-processor.interface";
import { ProcessorFactory } from "../factories/processor-factory";

// BUILDER PATTERN: Konstruira kompleksne ImagePipeline objekte korak po korak.
// Fluent API omogućuje chain: new ImagePipelineBuilder().withResize(800,600).withFilter("sepia").build()
// Odvaja konstrukciju - isti builder može kreirati različite pipelinee.
export class ImagePipelineBuilder {
  private options: ProcessingOptions = {};

  withResize(width?: number, height?: number, fit?: "cover" | "contain"): this {
    this.options.resize = { width, height, fit };
    return this;
  }

  withFilter(type: "sepia" | "blur" | "grayscale" | "sharpen"): this {
    this.options.filter = type;
    return this;
  }

  withFormat(format: "jpg" | "png" | "bmp" | "webp", quality?: number): this {
    this.options.format = format;
    this.options.quality = quality;
    return this;
  }

  withQuality(quality: number): this {
    this.options.quality = quality;
    return this;
  }

  build(): ImagePipeline {
    return new ImagePipeline(this.options);
  }
}

export class ImagePipeline {
  private processor = ProcessorFactory.create("sharp");

  constructor(private options: ProcessingOptions) {}

  async execute(input: Buffer): Promise<Buffer> {
    return await this.processor.process(input, this.options);
  }

  getOptions(): ProcessingOptions {
    return { ...this.options };
  }
}
