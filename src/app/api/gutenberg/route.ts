import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const bookId = searchParams.get("id");
  const mode = searchParams.get("mode") ?? "search"; // "search" | "text" | "popular"

  // Fetch full text of a specific book (first ~6000 words)
  if (mode === "text" && bookId) {
    try {
      const metaRes = await fetch(`https://gutendex.com/books/${bookId}/`, {
        headers: { "User-Agent": "ReadForge/1.0" },
      });
      const meta = await metaRes.json();
      const formats = meta.formats ?? {};

      // Prefer UTF-8 plain text
      const textUrl =
        formats["text/plain; charset=utf-8"] ||
        formats["text/plain; charset=us-ascii"] ||
        formats["text/plain"] ||
        null;

      if (!textUrl) {
        return NextResponse.json({ error: "No plain text format available" }, { status: 404 });
      }

      const textRes = await fetch(textUrl, { headers: { "User-Agent": "ReadForge/1.0" } });
      let fullText = await textRes.text();

      // Strip Gutenberg header/footer boilerplate
      const startMarkers = [
        "*** START OF THE PROJECT GUTENBERG",
        "*** START OF THIS PROJECT GUTENBERG",
        "*END*THE SMALL PRINT",
      ];
      const endMarkers = [
        "*** END OF THE PROJECT GUTENBERG",
        "*** END OF THIS PROJECT GUTENBERG",
        "End of the Project Gutenberg",
        "End of Project Gutenberg",
      ];

      for (const marker of startMarkers) {
        const idx = fullText.indexOf(marker);
        if (idx !== -1) {
          fullText = fullText.slice(fullText.indexOf("\n", idx) + 1);
          break;
        }
      }
      for (const marker of endMarkers) {
        const idx = fullText.indexOf(marker);
        if (idx !== -1) {
          fullText = fullText.slice(0, idx);
          break;
        }
      }

      // Take first ~6000 words
      const words = fullText.trim().split(/\s+/);
      const excerpt = words.slice(0, 6000).join(" ");

      return NextResponse.json({
        id: bookId,
        title: meta.title,
        authors: meta.authors,
        excerpt,
        wordCount: words.length,
        excerptWordCount: Math.min(6000, words.length),
      });
    } catch (err) {
      return NextResponse.json({ error: "Failed to fetch book text" }, { status: 500 });
    }
  }

  // Popular curated list (CARS-relevant subjects)
  if (mode === "popular") {
    const POPULAR_IDS = [1342, 11, 84, 1661, 2701, 98, 345, 74, 1400, 16328, 2554, 4300, 174, 1952, 5200];
    // Pride & Prejudice, Alice, Frankenstein, Sherlock, Moby Dick, Tale of Two Cities,
    // Dracula, Tom Sawyer, Great Expectations, Ulysses, Crime & Punishment, Ulysses,
    // Picture of Dorian Gray, 1984-ish, Metamorphosis
    try {
      const res = await fetch(
        `https://gutendex.com/books/?ids=${POPULAR_IDS.join(",")}&languages=en`,
        { headers: { "User-Agent": "ReadForge/1.0" } }
      );
      const data = await res.json();
      return NextResponse.json(data.results ?? []);
    } catch {
      return NextResponse.json([]);
    }
  }

  // Search books
  try {
    const params = new URLSearchParams({ languages: "en" });
    if (search) params.set("search", search);
    const res = await fetch(`https://gutendex.com/books/?${params}`, {
      headers: { "User-Agent": "ReadForge/1.0" },
    });
    const data = await res.json();
    return NextResponse.json(data.results ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
