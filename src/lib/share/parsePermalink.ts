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
    
    // 1. Parse Repository Parameter
    const repo = urlObj.searchParams.get("repo");
    if (repo) {
      let normalized = repo.trim();
      if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
        normalized = `https://github.com/${normalized}`;
      }
      result.repoUrl = normalized;
    }
    
    // 2. Parse Tab Parameter (extensible support)
    const tab = urlObj.searchParams.get("tab");
    if (tab === "overview") result.tab = "overview";
    else if (tab === "architecture" || tab === "map") result.tab = "map";
    else if (tab === "chat") result.tab = "chat";
    
    // 3. Parse Node Parameter (extensible support)
    const node = urlObj.searchParams.get("node");
    if (node) {
      result.node = node.trim();
    }
    
  } catch (err) {
    console.error("Failed to parse URL query parameters", err);
  }
  
  return result;
}
