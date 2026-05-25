export function parseHashtags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter((tag) => tag.length > 0 && tag.length <= 50);
}
