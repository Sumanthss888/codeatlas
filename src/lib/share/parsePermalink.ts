export interface ParsedLink {
  repoUrl: string | null;
  tab: "chat" | "overview" | "map" | null;
  node: string | null;
}

export function parsePermalink(url: string): ParsedLink {
  return {
    repoUrl: null,
    tab: null,
    node: null,
  };
}
