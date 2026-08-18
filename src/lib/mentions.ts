const MENTION_PATTERN = /@([a-zA-Z0-9_]{3,24})/g;

export function extractMentions(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.matchAll(MENTION_PATTERN);
  const seen = new Set<string>();
  for (const match of matches) {
    seen.add(match[1].toLowerCase());
    if (seen.size >= 10) break;
  }
  return Array.from(seen);
}
