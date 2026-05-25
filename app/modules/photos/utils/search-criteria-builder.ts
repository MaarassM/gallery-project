// FP REFACTOR #2: Photo search where-clause builder.
//
// BEFORE (photo-repository.ts): 30-line imperative if/else chain mutating a where object:
//   const where: Prisma.PhotoWhereInput = {};
//   if (criteria.hashtags && ...) { where.hashtags = { some: { ... } } }
//   if (criteria.minSize !== undefined ...) { where.sizeBytes = {} ... }
//   (7 more if statements)
//
// AFTER: Pure higher-order functions composed via Array.reduce().
//   Each filter function is independently testable and immutable.
//   Adding a new filter = adding a new pure function, no side effects on existing ones.

import type { Prisma } from "@prisma/client";
import type { SearchCriteria } from "../repositories/photo-repository";

type WhereFilter = (where: Prisma.PhotoWhereInput) => Prisma.PhotoWhereInput;

export function withHashtagFilter(hashtags?: string[]): WhereFilter {
  return (where) =>
    hashtags && hashtags.length > 0
      ? { ...where, hashtags: { some: { hashtag: { name: { in: hashtags } } } } }
      : where;
}

export function withSizeFilter(min?: number, max?: number): WhereFilter {
  return (where) => {
    if (min === undefined && max === undefined) return where;
    return {
      ...where,
      sizeBytes: {
        ...(min !== undefined ? { gte: min } : {}),
        ...(max !== undefined ? { lte: max } : {}),
      },
    };
  };
}

export function withDateFilter(from?: Date, to?: Date): WhereFilter {
  return (where) => {
    if (!from && !to) return where;
    return {
      ...where,
      uploadedAt: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    };
  };
}

export function withAuthorFilter(authorId?: string): WhereFilter {
  return (where) => (authorId ? { ...where, userId: authorId } : where);
}

// Function composition: applies filters left to right, each returning a new object (immutable).
export function buildSearchWhere(criteria: SearchCriteria): Prisma.PhotoWhereInput {
  const filters: WhereFilter[] = [
    withHashtagFilter(criteria.hashtags),
    withSizeFilter(criteria.minSize, criteria.maxSize),
    withDateFilter(criteria.dateFrom, criteria.dateTo),
    withAuthorFilter(criteria.authorId),
  ];
  return filters.reduce(
    (where, filter) => filter(where),
    {} as Prisma.PhotoWhereInput,
  );
}
