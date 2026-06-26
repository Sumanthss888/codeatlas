export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, falling back", err);
    }
  }
  return false;
}
