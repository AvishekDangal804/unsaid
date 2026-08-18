const HASHTAG_PATTERN = /#([a-zA-Z][a-zA-Z0-9_]{1,29})/g;

export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.matchAll(HASHTAG_PATTERN);
  const seen = new Set<string>();
  for (const match of matches) {
    seen.add(match[1].toLowerCase());
    if (seen.size >= 10) break;
  }
  return Array.from(seen);
}
