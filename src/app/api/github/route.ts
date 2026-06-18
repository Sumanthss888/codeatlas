import { NextResponse } from "next/server";

const MAX_FILES = 80; // 🔥 limit to avoid rate limit
const MAX_FILE_SIZE = 20000; // ~20KB per file

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const repoUrl = searchParams.get("url");

    if (!repoUrl) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const [owner, repo] = repoUrl
      .replace("https://github.com/", "")
      .replace(".git", "")
      .split("/");

    // ── 1. Get repo info ───────────────────────────────
    const repoRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`
    );
    const repoData = await repoRes.json();

    const branch = repoData.default_branch;

    // ── 2. Get full file tree ──────────────────────────
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );
    const treeData = await treeRes.json();

    // ── 3. Filter useful source files ──────────────────
    const allowedExtensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".java",
      ".go",
      ".cpp",
      ".json",
      ".md",
    ];

    const files = (treeData.tree || [])
      .filter((item: any) => item.type === "blob")
      .filter((file: any) =>
        allowedExtensions.some((ext) => file.path.endsWith(ext))
      )
      .slice(0, MAX_FILES);

    // ── 4. Fetch file content (RAW GitHub) ─────────────
    const fileData = await Promise.all(
      files.map(async (file: any) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;

          const res = await fetch(rawUrl);
          const text = await res.text();

          return {
            fileName: file.path.split("/").pop(),
            filePath: file.path,
            content: text.slice(0, MAX_FILE_SIZE), // 🔥 limit size
          };
        } catch {
          return {
            fileName: file.path.split("/").pop(),
            filePath: file.path,
            content: "",
          };
        }
      })
    );

    // ── 5. Return enriched data ────────────────────────
    const githubMetadata = repoData && repoData.id ? {
      stars: repoData.stargazers_count ?? 0,
      forks: repoData.forks_count ?? 0,
      language: repoData.language || null,
      license: repoData.license?.name || repoData.license?.spdx_id || null,
      lastCommitDate: repoData.pushed_at || repoData.updated_at || null,
      visibility: repoData.visibility || (repoData.private ? "private" : "public"),
      description: repoData.description || ""
    } : null;

    return NextResponse.json({
      totalFiles: fileData.length,
      files: fileData,
      githubMetadata,
    });
  } catch (err) {
    console.error("GitHub API error:", err);

    return NextResponse.json(
      { error: "Failed to fetch repository" },
      { status: 500 }
    );
  }
}