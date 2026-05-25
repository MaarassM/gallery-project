// ASPECT: Performance timing — measures and logs method execution duration.
// Logs only when duration exceeds thresholdMs (0 = always log).
// Applied to: ImageProcessingService.processUpload, ImageProcessingService.processDownload
export function Perf(thresholdMs = 0): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const name = `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const start = performance.now();
      const result = await originalMethod.apply(this, args);
      const durationMs = performance.now() - start;

      if (durationMs >= thresholdMs) {
        console.log(`[PERF] ${name} took ${durationMs.toFixed(2)}ms`);
      }
      return result;
    };

    return descriptor;
  };
}
