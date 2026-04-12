import { NextRequest, NextResponse } from "next/server";

const MODEL = "llama-3.1-8b-instant";

const MAX_FILES = 8;
const MAX_CONTENT = 1500;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, files, mode } = body;

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // ── 🔥 SUMMARY MODE ───────────────────────────────
    if (mode === "summary") {
      const fileList = files
        .slice(0, 80)
        .map((f: any) => f.filePath)
        .join("\n");

      const systemPrompt = `
You are a senior software architect.

Analyze the repository structure and give a high-level summary.

Include:
- Tech stack
- Architecture type
- Important folders
- Observations

Be structured and concise.
`;

      const userPrompt = `
Repository structure:
${fileList}

Generate a summary.
`;

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
          }),
        }
      );

      const data = await response.json();

      return NextResponse.json({
        answer: data?.choices?.[0]?.message?.content,
      });
    }

    // ── 🔥 NORMAL QA MODE (RAG) ───────────────────────
    const lowerQ = question.toLowerCase();

    const scored = files.map((f: any) => {
      let score = 0;

      if (lowerQ.includes("auth") && f.filePath.includes("auth")) score += 5;
      if (lowerQ.includes("api") && f.filePath.includes("api")) score += 5;
      if (lowerQ.includes("db")) score += f.filePath.includes("db") ? 5 : 0;
      if (lowerQ.includes("model")) score += f.filePath.includes("model") ? 5 : 0;

      if (f.filePath.includes("page")) score += 2;
      if (f.filePath.includes("layout")) score += 2;

      return { ...f, score };
    });

    const topFiles = scored
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, MAX_FILES);

    const codeContext = topFiles
      .map((f: any) => {
        const content = (f.content || "")
          .replace(/\s+/g, " ")
          .slice(0, MAX_CONTENT);

        return `FILE: ${f.filePath}\n${content}`;
      })
      .join("\n\n");

    const systemPrompt = `
You are a senior engineer analyzing code.

Rules:
- Use only given code
- No hallucination
- Be concise
- Explain relationships clearly
`;

    const userPrompt = `
Code:
${codeContext}

Question:
${question}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return NextResponse.json(
        { error: data?.error?.message || "AI failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      answer: data?.choices?.[0]?.message?.content,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}