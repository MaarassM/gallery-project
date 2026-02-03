import type { ImageProcessor } from "../processors/image-processor.interface";
import { SharpProcessor } from "../processors/sharp-processor";

// FACTORY PATTERN: Stvara ImageProcessor instance na temelju type parametra.
// Centralizira kreiranje objekata - lako dodati nove processore (ImageMagick, Jimp).
// Korištenje: ProcessorFactory.create("sharp") vraća SharpProcessor instancu.
export class ProcessorFactory {
  static create(type: "sharp" = "sharp"): ImageProcessor {
    switch (type) {
      case "sharp":
        return new SharpProcessor();
      default:
        return new SharpProcessor();
    }
  }
}
