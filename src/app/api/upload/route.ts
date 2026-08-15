import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/session";
import { addDocument } from "@/lib/db/server";
import { calculateFleschScore, fleschToLevel, countWords } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const pastedText = formData.get("text") as string | null;
  const title = (formData.get("title") as string) || "Untitled Document";
  const author = (formData.get("author") as string) || "";

  let content = "";
  let fileType = "text";

  if (pastedText && pastedText.trim().length > 0) {
    content = pastedText.trim();
    fileType = "text";
  } else if (file) {
    fileType = file.name.endsWith(".pdf") ? "pdf" : "text";

    if (fileType === "pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Dynamic import to avoid edge runtime issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(buffer);
        content = pdfData.text.replace(/\s+/g, " ").trim();
      } catch {
        return NextResponse.json(
          { error: "Failed to extract PDF text. Try pasting the text instead." },
          { status: 422 }
        );
      }
    } else {
      content = await file.text();
    }
  }

  if (!content || content.length < 100) {
    return NextResponse.json(
      { error: "Content too short — minimum 100 characters." },
      { status: 422 }
    );
  }

  const wordCount = countWords(content);
  const fleschScore = calculateFleschScore(content);
  const readingLevel = fleschToLevel(fleschScore);

  try {
    const document = await addDocument(user.uid, {
      title,
      author: author || null,
      content,
      wordCount,
      fileType,
      readingLevel,
      fleschScore,
    });
    return NextResponse.json({ success: true, document });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
