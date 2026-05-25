// ASPECT: Error handling — catches, logs, and optionally silences errors.
// When silent=true the method returns undefined instead of throwing (useful for audit logging).
// Applied to: PackageService.checkUploadLimit, AuditService.log
export function HandleErrors(opts: { silent?: boolean } = {}): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const name = `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[ERROR] ${name} threw: ${message}`);
        if (opts.silent) return undefined;
        throw error;
      }
    };

    return descriptor;
  };
}
