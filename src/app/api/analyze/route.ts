import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/session";
import { analyzePassage } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
    const analysis = await analyzePassage(text);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
