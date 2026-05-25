// Unit test for ImagePipelineBuilder — pure builder state, no I/O.
// AAA pattern: Arrange (new builder), Act (chain methods), Assert (getOptions).
// Compare with Spring unit tests: no DI container needed here because
// ImagePipelineBuilder has zero external dependencies — all state is local.
import { describe, it, expect } from "vitest";
import { ImagePipelineBuilder } from "~/modules/images/pipelines/pipeline-builder";

describe("ImagePipelineBuilder", () => {
  it("builds a pipeline with empty options when nothing is chained", () => {
    // Arrange + Act
    const pipeline = new ImagePipelineBuilder().build();
    // Assert
    expect(pipeline.getOptions()).toEqual({});
  });

  it("sets resize options correctly via withResize()", () => {
    const pipeline = new ImagePipelineBuilder()
      .withResize(800, 600, "cover")
      .build();

    expect(pipeline.getOptions().resize).toEqual({
      width: 800,
      height: 600,
      fit: "cover",
    });
  });

  it("sets filter via withFilter()", () => {
    const pipeline = new ImagePipelineBuilder().withFilter("sepia").build();
    expect(pipeline.getOptions().filter).toBe("sepia");
  });

  it("sets format and quality via withFormat()", () => {
    const pipeline = new ImagePipelineBuilder().withFormat("png", 90).build();
    const opts = pipeline.getOptions();
    expect(opts.format).toBe("png");
    expect(opts.quality).toBe(90);
  });

  it("chains resize + filter + format together", () => {
    const pipeline = new ImagePipelineBuilder()
      .withResize(1920, 1080, "contain")
      .withFilter("grayscale")
      .withFormat("jpg", 75)
      .build();

    const opts = pipeline.getOptions();
    expect(opts.resize?.width).toBe(1920);
    expect(opts.filter).toBe("grayscale");
    expect(opts.format).toBe("jpg");
  });

  it("withQuality sets quality independently", () => {
    const pipeline = new ImagePipelineBuilder().withQuality(50).build();
    expect(pipeline.getOptions().quality).toBe(50);
  });
});
