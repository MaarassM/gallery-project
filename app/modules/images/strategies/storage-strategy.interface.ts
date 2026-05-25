// SOLID — LSP (Liskov Substitution Principle):
// Any implementation of StorageStrategy MUST be safely substitutable for any other.
// Contracts documented below define the invariants that ALL implementations must uphold.
// Violation example: CloudStorageStrategy previously threw "Not implemented" — that
//   broke LSP because substituting it would crash the app.
export type StorageStrategy = {
  /** Store buffer at the given category folder. Returns the storage path.
   *  MUST NOT throw for valid Buffers. MUST return a non-empty path string. */
  store(
    buffer: Buffer,
    category: "originals" | "thumbnails" | "processed",
  ): Promise<string>;

  /** Retrieve file by path. Throws Error if path does not exist (not a no-op). */
  retrieve(path: string): Promise<Buffer>;

  /** Delete file by path. MUST be idempotent — no-op if the path doesn't exist. */
  delete(path: string): Promise<void>;

  /** Returns true if the path exists, false otherwise. MUST NOT throw. */
  exists(path: string): Promise<boolean>;
};
