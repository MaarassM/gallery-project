// Unit test for hashtag parsing — pure function with no side effects.
// Contrast with integration test (tests/integration/photo-repository.test.ts)
// which verifies hashtags are persisted to the database.
// No mocks needed: pure function, deterministic, no I/O.
import { describe, it, expect } from "vitest";
import { parseHashtags } from "~/modules/photos/utils/hashtag-parser";

describe("parseHashtags", () => {
  it("returns empty array for undefined input", () => {
    expect(parseHashtags(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseHashtags("")).toEqual([]);
  });

  it("strips leading # from tags", () => {
    expect(parseHashtags("#nature,#travel")).toEqual(["nature", "travel"]);
  });

  it("trims surrounding whitespace from tags", () => {
    expect(parseHashtags("  nature  ,  travel  ")).toEqual(["nature", "travel"]);
  });

  it("filters out empty tags after trimming", () => {
    expect(parseHashtags("nature,,travel")).toEqual(["nature", "travel"]);
  });

  it("filters out tags longer than 50 characters", () => {
    const longTag = "a".repeat(51);
    expect(parseHashtags(`nature,${longTag}`)).toEqual(["nature"]);
  });

  it("accepts tags that are exactly 50 characters", () => {
    const maxTag = "a".repeat(50);
    expect(parseHashtags(maxTag)).toEqual([maxTag]);
  });

  it("handles a mix of # prefixed and plain tags", () => {
    expect(parseHashtags("#sky,ocean,#mountain")).toEqual([
      "sky",
      "ocean",
      "mountain",
    ]);
  });
});
