// STRATEGY PATTERN: Interface koji definira sve storage implementacije.
// Omogućuje prebacivanje između LocalStorageStrategy i CloudStorageStrategy bez mijenjanja koda.
// Korištenje: ImageProcessingService koristi ovaj interface, može zamijeniti implementacije za vrijeme izvođenja.
export type StorageStrategy = {
  store(
    buffer: Buffer,
    category: "originals" | "thumbnails" | "processed",
  ): Promise<string>;
  retrieve(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
};
