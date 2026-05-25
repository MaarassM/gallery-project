// SOLID — OCP (Open/Closed Principle):
//
// BEFORE (sharp-processor.ts): Adding a new filter required editing SharpProcessor
//   with a new if/else branch — the class was NOT closed for modification.
//
// AFTER: filterRegistry maps names to transform functions. Adding a new filter
//   means calling registerFilter() — SharpProcessor never changes.
//   The system is open for extension (new filters) but closed for modification.

import type sharp from "sharp";

type SharpTransform = (pipeline: ReturnType<typeof import("sharp")>) => ReturnType<typeof import("sharp")>;

const registry = new Map<string, SharpTransform>([
  ["sepia", (p) => p.recomb([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]])],
  ["blur", (p) => p.blur(3)],
  ["grayscale", (p) => p.grayscale()],
  ["sharpen", (p) => p.sharpen()],
]);

export function applyRegisteredFilter<T extends ReturnType<typeof import("sharp")>>(
  pipeline: T,
  filterName: string,
): T {
  const transform = registry.get(filterName);
  if (!transform) throw new Error(`Unknown filter: "${filterName}". Available: ${[...registry.keys()].join(", ")}`);
  return transform(pipeline) as T;
}

export function registerFilter(name: string, transform: SharpTransform): void {
  registry.set(name, transform);
}

export function listFilters(): string[] {
  return [...registry.keys()];
}
