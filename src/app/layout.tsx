import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeAtlas – AI-Powered Codebase Understanding",
  description:
    "Understand any codebase instantly with AI. Explore architecture, trace data flows, and ask questions about your code.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="app-root">
        {children}
      </body>
    </html>
  );
}