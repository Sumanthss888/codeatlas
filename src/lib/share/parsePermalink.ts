export interface ParsedLink {
  repoUrl: string | null;
  tab: "chat" | "overview" | "map" | null;
  node: string | null;
}

export function parsePermalink(url: string): ParsedLink {
  const result: ParsedLink = {
    repoUrl: null,
    tab: null,
    node: null,
  };
  if (!url) return result;
  try {
    const urlObj = new URL(url, typeof window !== "undefined" ? window.location.origin : undefined);
    const repo = urlObj.searchParams.get("repo");
    if (repo) {
      let normalized = repo.trim();
      if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
        normalized = `https://github.com/${normalized}`;
      }
      result.repoUrl = normalized;
    }
  } catch (err) {
    console.error("Failed to parse URL query parameters", err);
  }
  return result;
}
