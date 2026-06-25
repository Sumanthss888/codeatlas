export const markdownCSS = `
.markdown-summary-container {
  font-family: var(--font-family);
}

.markdown-h3 {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent-color);
  margin-top: 24px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle);
  display: block;
}

.markdown-h3:first-of-type {
  margin-top: 0;
}

.markdown-p {
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.markdown-p:last-child {
  margin-bottom: 0;
}

.markdown-ul {
  list-style: none;
  padding-left: 0;
  margin-bottom: 12px;
}

.markdown-li {
  position: relative;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.markdown-li::before {
  content: "◆";
  position: absolute;
  left: 4px;
  top: 0;
  color: var(--accent-color);
  font-size: 8px;
  line-height: 1.65;
}

.markdown-li .markdown-ul {
  margin-top: 6px;
  margin-bottom: 0;
}

.markdown-li .markdown-li::before {
  content: "›";
  left: 5px;
  top: -2px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: bold;
}
`;
