/**
 * Preprocesses markdown text by turning lines that consist solely of bold text
 * (e.g. "**Repository Structure Summary**") into semantic h3 headings ("### Repository Structure Summary").
 */
export function preprocessSummaryMarkdown(markdown: string): string {
  if (!markdown) return "";
  
  const lines = markdown.split("\n");
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    
    // Check if the line matches exactly "**Text**" or "**Text:**"
    const boldLineMatch = trimmed.match(/^\*\*([^*]+?)\*\*$/);
    if (boldLineMatch) {
      const headingContent = boldLineMatch[1].trim();
      return `### ${headingContent}`;
    }
    
    return line;
  });
  
  return processedLines.join("\n");
}
