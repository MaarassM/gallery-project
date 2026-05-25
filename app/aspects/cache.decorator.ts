// ASPECT: Result caching — memoizes method return values with a TTL.
// Cache key is built from the method name + JSON-serialised arguments.
// Applied to: PhotoRepository.search
const _cache = new Map<string, { value: unknown; expiresAt: number }>();

export function Cache(ttlMs = 60_000): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const name = `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const key = `${name}:${JSON.stringify(args)}`;
      const cached = _cache.get(key);

      if (cached && Date.now() < cached.expiresAt) {
        console.log(`[CACHE] Hit for ${name}`);
        return cached.value;
      }

      const result = await originalMethod.apply(this, args);
      _cache.set(key, { value: result, expiresAt: Date.now() + ttlMs });
      return result;
    };

    return descriptor;
  };
}

export function clearCache() {
  _cache.clear();
}
