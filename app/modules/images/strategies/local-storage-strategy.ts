import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { StorageStrategy } from "./storage-strategy.interface";

// STRATEGY PATTERN: Konkretna implementacija za lokalni file system storage.
// Implementira StorageStrategy interface - može se zamijeniti s CloudStorageStrategy.
export class LocalStorageStrategy implements StorageStrategy {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_PATH || "./storage";
  }

  async store(
    buffer: Buffer,
    category: "originals" | "thumbnails" | "processed",
  ): Promise<string> {
    // Generiraj jedinstveno ime datoteke
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.jpg`;
    const categoryPath = path.join(this.basePath, category);
    const filePath = path.join(categoryPath, filename);

    // Osiguraj da direktorij postoji
    await fs.mkdir(categoryPath, { recursive: true });

    // Zapiši datoteku
    await fs.writeFile(filePath, buffer);

    // Vrati relativnu putanju od storage roota
    return path.join(category, filename);
  }

  async retrieve(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, relativePath);
    return await fs.readFile(fullPath);
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);
    await fs.unlink(fullPath);
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, relativePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
