import { NextResponse } from "next/server";
import {
  generateComprehensionQuestions,
  generateCARSQuestions,
} from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passage, mode, level, count = 5 } = body;

    if (!passage) {
      return NextResponse.json({ error: "passage required" }, { status: 400 });
    }

    const questions =
      mode === "cars"
        ? await generateCARSQuestions(passage, count)
        : await generateComprehensionQuestions(passage, level ?? "college", count);

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("Questions API error:", err);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
