export function buildPermalink(repoUrl: string): string {
  if (!repoUrl) return "";
  let repoParam = repoUrl.trim();
  if (typeof window !== "undefined") {
    return `${window.location.origin}/?repo=${encodeURIComponent(repoParam)}`;
  }
  return `/?repo=${encodeURIComponent(repoParam)}`;
}
