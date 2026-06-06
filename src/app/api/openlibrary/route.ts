import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface OLDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  ia?: string[];
  number_of_pages_median?: number;
  language?: string[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("search") ?? "";
  const mode = searchParams.get("mode") ?? "search"; // "search" | "text" | "popular"
  const iaId = searchParams.get("ia"); // Internet Archive ID for text fetch

  // Fetch full text from Internet Archive
  if (mode === "text" && iaId) {
    try {
      // Try plain text formats in order of preference
      const textUrls = [
        `https://archive.org/download/${iaId}/${iaId}_djvu.txt`,
        `https://archive.org/download/${iaId}/${iaId}.txt`,
      ];

      // First get metadata to find the best text file
      const metaRes = await fetch(`https://archive.org/metadata/${iaId}`, {
        headers: { "User-Agent": "ReadForge/1.0" },
      });
      const meta = await metaRes.json();
      const files: { name: string; format: string }[] = meta.files ?? [];

      // Find best plain text file
      const txtFile =
        files.find((f) => f.format === "DjVuTXT") ||
        files.find((f) => f.name?.endsWith("_djvu.txt")) ||
        files.find((f) => f.format === "Plain Text") ||
        files.find((f) => f.name?.endsWith(".txt") && !f.name.includes("_meta"));

      const textUrl = txtFile
        ? `https://archive.org/download/${iaId}/${txtFile.name}`
        : textUrls[0];

      const textRes = await fetch(textUrl, {
        headers: { "User-Agent": "ReadForge/1.0" },
      });

      if (!textRes.ok) throw new Error("Text not available");

      let fullText = await textRes.text();

      // Strip OCR artifacts and normalize
      fullText = fullText
        .replace(/\f/g, "\n")
        .replace(/([a-z])-\n([a-z])/g, "$1$2") // fix hyphenated line breaks
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const words = fullText.split(/\s+/);
      const excerpt = words.slice(0, 6000).join(" ");

      return NextResponse.json({
        iaId,
        title: meta.metadata?.title ?? "",
        author: meta.metadata?.creator ?? "",
        excerpt,
        wordCount: words.length,
        excerptWordCount: Math.min(6000, words.length),
      });
    } catch {
      return NextResponse.json(
        { error: "Full text not available for this book. Try reading on Open Library directly." },
        { status: 404 }
      );
    }
  }

  // Popular curated list — CARS-relevant works
  if (mode === "popular") {
    const popularQueries = ["philosophy enlightenment", "darwin evolution", "william james psychology", "tocqueville democracy", "john stuart mill liberty"];
    try {
      const results: OLDoc[] = [];
      for (const q of popularQueries) {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,author_name,first_publish_year,cover_i,subject,ia,number_of_pages_median&limit=4&language=eng`,
          { headers: { "User-Agent": "ReadForge/1.0" } }
        );
        const data = await res.json();
        const docs: OLDoc[] = (data.docs ?? []).filter((d: OLDoc) => d.ia && d.ia.length > 0);
        results.push(...docs.slice(0, 2));
      }
      return NextResponse.json(results.slice(0, 18).map(formatBook));
    } catch {
      return NextResponse.json([]);
    }
  }

  // Search
  if (!query) return NextResponse.json([]);

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=key,title,author_name,first_publish_year,cover_i,subject,ia,number_of_pages_median&limit=20&language=eng`,
      { headers: { "User-Agent": "ReadForge/1.0" } }
    );
    const data = await res.json();
    const docs: OLDoc[] = data.docs ?? [];
    return NextResponse.json(docs.map(formatBook));
  } catch {
    return NextResponse.json([]);
  }
}

function formatBook(doc: OLDoc) {
  return {
    key: doc.key,
    title: doc.title,
    authors: doc.author_name ?? [],
    firstPublishYear: doc.first_publish_year,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
    subjects: (doc.subject ?? []).slice(0, 4),
    ia: doc.ia?.[0] ?? null, // Internet Archive ID — needed for full text
    pages: doc.number_of_pages_median,
    hasFullText: !!(doc.ia && doc.ia.length > 0),
  };
}
