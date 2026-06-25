"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { preprocessSummaryMarkdown } from "./markdownParser";
import { markdownCSS } from "./markdownStyles";

type Props = {
  content: string | null | undefined;
};

const customComponents = {
  h1: ({ children }: any) => <h3 className="markdown-h3">{children}</h3>,
  h2: ({ children }: any) => <h3 className="markdown-h3">{children}</h3>,
  h3: ({ children }: any) => <h3 className="markdown-h3">{children}</h3>,
  p: ({ children }: any) => <p className="markdown-p">{children}</p>,
  ul: ({ children }: any) => <ul className="markdown-ul">{children}</ul>,
  li: ({ children }: any) => <li className="markdown-li">{children}</li>,
};

export default function MarkdownRenderer({ content }: Props) {
  const processedContent = useMemo(() => {
    return preprocessSummaryMarkdown(content || "");
  }, [content]);

  if (!content) return null;

  return (
    <div className="markdown-summary-container">
      <style dangerouslySetInnerHTML={{ __html: markdownCSS }} />
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents as any}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
