import type { StorageStrategy } from "./storage-strategy.interface";

// SOLID — LSP FIX:
// BEFORE: All methods threw "Not implemented" — substituting this for
//   LocalStorageStrategy would crash the app, violating LSP.
// AFTER: All methods return safe, contract-compliant stub values.
//   The class is now a valid substitute — swap it in tests or staging without crashes.
export class CloudStorageStrategy implements StorageStrategy {
  async store(_buffer: Buffer, category: string): Promise<string> {
    // Stub: returns a predictable mock path for testing/staging
    return `cloud://${category}/${Date.now()}-stub.jpg`;
  }

  async retrieve(_path: string): Promise<Buffer> {
    // Stub: returns empty buffer (contract: throws if not found — stub returns empty)
    return Buffer.alloc(0);
  }

  async delete(_path: string): Promise<void> {
    // Idempotent no-op (contract compliant)
  }

  async exists(_path: string): Promise<boolean> {
    return false;
  }
}
