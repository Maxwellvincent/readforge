import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/session";
import { getReadwiseToken } from "@/lib/db/server";

export const dynamic = "force-dynamic";

// Readwise Reader API v3
const RW_BASE = "https://readwise.io/api/v3";

export interface ReadwiseDocument {
  id: string;
  url: string | null;
  title: string;
  author: string | null;
  source: string | null;
  category: "article" | "email" | "rss" | "highlight" | "note" | "pdf" | "epub" | "tweet" | "video" | "book";
  location: "new" | "later" | "shortlist" | "archive" | "feed";
  tags: Record<string, { name: string }>;
  site_name: string | null;
  word_count: number | null;
  created_at: string;
  updated_at: string;
  published_date: string | null;
  summary: string | null;
  image_url: string | null;
  source_url: string | null;
  reading_progress: number; // 0–1
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  // The token is never accepted from the client — it lives in a server-only doc.
  const token = await getReadwiseToken(user.uid);
  const location = searchParams.get("location") ?? "later"; // new|later|shortlist|archive
  const category = searchParams.get("category"); // article|pdf|epub|book
  const cursor = searchParams.get("cursor");

  if (!token) {
    return NextResponse.json({ error: "Readwise is not connected" }, { status: 400 });
  }

  const params = new URLSearchParams();
  if (location) params.set("location", location);
  if (category) params.set("category", category);
  if (cursor) params.set("pageCursor", cursor);
  params.set("withHtmlContent", "false");

  try {
    const res = await fetch(`${RW_BASE}/list/?${params}`, {
      headers: { Authorization: `Token ${token}` },
    });

    if (res.status === 401) {
      return NextResponse.json({ error: "Invalid Readwise token. Check your access token at readwise.io/access_token" }, { status: 401 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Readwise returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      results: data.results ?? [],
      nextPageCursor: data.nextPageCursor ?? null,
      count: data.count ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach Readwise" }, { status: 502 });
  }
}
