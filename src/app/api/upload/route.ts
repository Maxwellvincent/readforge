import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { calculateFleschScore, fleschToLevel, countWords } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
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
      } catch (err) {
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

  const { data, error } = await supabase
    .from("user_documents")
    .insert({
      user_id: user.id,
      title,
      author: author || null,
      content,
      word_count: wordCount,
      file_type: fileType,
      reading_level: readingLevel,
      flesch_score: fleschScore,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, document: data });
}
