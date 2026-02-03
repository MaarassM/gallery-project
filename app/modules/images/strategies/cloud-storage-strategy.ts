import type { StorageStrategy } from "./storage-strategy.interface";

// STRATEGY PATTERN: Konkretna implementacija za cloud storage (AWS S3, itd.).
// Implementira isti StorageStrategy interface - može zamijeniti LocalStorageStrategy.
export class CloudStorageStrategy implements StorageStrategy {
  async store(): Promise<string> {
    throw new Error("Cloud storage not implemented yet");
  }

  async retrieve(): Promise<Buffer> {
    throw new Error("Cloud storage not implemented yet");
  }

  async delete(): Promise<void> {
    throw new Error("Cloud storage not implemented yet");
  }

  async exists(): Promise<boolean> {
    throw new Error("Cloud storage not implemented yet");
  }
}
