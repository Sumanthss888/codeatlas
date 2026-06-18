import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files, summary, githubMetadata, messages } = body;

    if (!files) {
      return NextResponse.json({ error: "Missing payload files" }, { status: 400 });
    }

    // Generate unique short 12-char hex ID
    const id = crypto.randomBytes(6).toString("hex");

    const sharesDir = path.join(process.cwd(), "public", "shares");
    if (!fs.existsSync(sharesDir)) {
      fs.mkdirSync(sharesDir, { recursive: true });
    }

    const filePath = path.join(sharesDir, `${id}.json`);
    
    const snapshot = {
      id,
      timestamp: new Date().toISOString(),
      files,
      summary,
      githubMetadata,
      messages
    };

    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf8");

    return NextResponse.json({ id });
  } catch (err: any) {
    console.error("Failed to store analysis snapshot:", err);
    return NextResponse.json(
      { error: err.message || "Failed to store analysis snapshot" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing share identifier ID" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "shares", `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Report analysis not found" }, { status: 404 });
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Failed to retrieve analysis snapshot:", err);
    return NextResponse.json({ error: "Failed to retrieve analysis snapshot" }, { status: 500 });
  }
}
