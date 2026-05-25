import { bench, describe } from "vitest";
import {
  buildSearchWhere,
  withHashtagFilter,
  withSizeFilter,
  withDateFilter,
  withAuthorFilter,
} from "~/modules/photos/utils/search-criteria-builder";

describe("buildSearchWhere", () => {
  bench("no filters — empty criteria", () => {
    buildSearchWhere({});
  });

  bench("single hashtag filter", () => {
    buildSearchWhere({ hashtags: ["nature"] });
  });

  bench("all filters combined", () => {
    buildSearchWhere({
      hashtags: ["nature", "travel", "landscape"],
      minSize: 10_000,
      maxSize: 5_000_000,
      dateFrom: new Date("2024-01-01"),
      dateTo: new Date("2024-12-31"),
      authorId: "user-123",
    });
  });

  bench("10 hashtags", () => {
    buildSearchWhere({
      hashtags: Array.from({ length: 10 }, (_, i) => `tag${i}`),
    });
  });
});

describe("individual filter HOFs", () => {
  bench("withHashtagFilter — 5 tags", () => {
    const filter = withHashtagFilter(["a", "b", "c", "d", "e"]);
    filter({});
  });

  bench("withSizeFilter — both bounds", () => {
    const filter = withSizeFilter(1000, 5_000_000);
    filter({});
  });

  bench("withDateFilter — both bounds", () => {
    const filter = withDateFilter(new Date("2024-01-01"), new Date("2024-12-31"));
    filter({});
  });

  bench("withAuthorFilter — with id", () => {
    const filter = withAuthorFilter("user-abc");
    filter({});
  });
});
