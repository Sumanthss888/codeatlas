export function buildPermalink(repoUrl: string): string {
  if (!repoUrl) return "";
  
  let repoParam = repoUrl.trim();
  // Extract owner/repo part for short, clean GitHub URLs
  const githubMatch = repoParam.match(/github\.com\/([^/]+\/[^/]+)/);
  if (githubMatch) {
    repoParam = githubMatch[1];
  }
  
  if (typeof window !== "undefined") {
    return `${window.location.origin}/?repo=${encodeURIComponent(repoParam)}`;
  }
  return `/?repo=${encodeURIComponent(repoParam)}`;
}
