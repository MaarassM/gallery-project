import { bench, describe } from "vitest";
import { parseHashtags } from "~/modules/photos/utils/hashtag-parser";

describe("parseHashtags", () => {
  bench("empty string", () => {
    parseHashtags("");
  });

  bench("undefined", () => {
    parseHashtags(undefined);
  });

  bench("5 hashtags with #prefix", () => {
    parseHashtags("#nature,#travel,#photography,#landscape,#sunset");
  });

  bench("20 hashtags — large input", () => {
    const tags = Array.from({ length: 20 }, (_, i) => `#tag${i}`).join(",");
    parseHashtags(tags);
  });

  bench("tags with extra whitespace", () => {
    parseHashtags("  nature ,  travel ,  photography  ");
  });

  bench("tags with mixed prefix and no-prefix", () => {
    parseHashtags("nature,#travel,photography,#landscape");
  });
});
