// ASPECT: Logging — logs method entry and exit with truncated args/result.
// Implements cross-cutting logging without modifying business logic.
// Applied to: ImageProcessingService.processUpload, ImageProcessingService.processDownload
export function Log(label?: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const name = label ?? `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const argsPreview = JSON.stringify(args.map((a) => typeof a === "object" ? "[object]" : a)).slice(0, 100);
      console.log(`[LOG] ▶ ${name}(${argsPreview})`);
      const result = await originalMethod.apply(this, args);
      console.log(`[LOG] ✓ ${name} completed`);
      return result;
    };

    return descriptor;
  };
}
