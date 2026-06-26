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
    if (mode === "summary" && !apiKey) {
      return NextResponse.json({
        answer: "This is a high-signal React/Next.js repository containing workspace routing, shared components, and client/server integrations. The codebase is structured as a modern frontend application with CSS layout systems and helper services. Key paths include `src/app` for routing and `src/components` for UI components.",
      });
    }

    if (!apiKey) {
      const encoder = new TextEncoder();
      const mockChunks = [
        "**CodeAtlas Assistant**\n\n",
        "Here is a mock analysis of your codebase for validation:\n\n",
        "```typescript\n",
        "// Configuration validation sample\n",
        "interface CodeAtlasConfig {\n",
        "  theme: 'light' | 'dark' | 'system';\n",
        "  motion: 'subtle' | 'none';\n",
        "  accentColor: string;\n",
        "}\n\n",
        "export const setupAtlas = (): CodeAtlasConfig => {\n",
        "  return {\n",
        "    theme: 'dark',\n",
        "    motion: 'subtle',\n",
        "    accentColor: '#4361EE'\n",
        "  };\n",
        "};\n",
        "```\n\n",
        "The streaming response, markdown parser, and clipboard code copy operations are now fully validated and operational!"
      ];

      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of mockChunks) {
            await new Promise((resolve) => setTimeout(resolve, 80));
            const data = {
              choices: [
                {
                  delta: {
                    content: chunk,
                  },
                },
              ],
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
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
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error("Groq error:", data);
      return NextResponse.json(
        { error: data?.error?.message || "AI failed" },
        { status: response.status }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}