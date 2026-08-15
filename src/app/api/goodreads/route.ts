import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { getSessionUser } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

const parser = new Parser();

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const shelf = searchParams.get("shelf") ?? "currently-reading";

  if (!userId) {
    return NextResponse.json({ error: "Missing Goodreads user ID" }, { status: 400 });
  }

  try {
    const rssUrl = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}`;
    const feed = await parser.parseURL(rssUrl);

    const books = feed.items.map((item) => ({
      id: item.guid ?? item.link ?? Math.random().toString(),
      title: item.title ?? "Untitled",
      author: item.creator ?? extractAuthor(item.content ?? ""),
      description: stripHtml(item.content ?? item.contentSnippet ?? ""),
      link: item.link ?? "",
      cover: extractImage(item.content ?? ""),
      rating: extractRating(item.content ?? ""),
      dateAdded: item.pubDate ?? "",
      shelf,
    }));

    return NextResponse.json({ books, feedTitle: feed.title ?? "Goodreads Shelf" });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch shelf. Make sure your Goodreads profile is public." },
      { status: 422 }
    );
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
}

function extractImage(html: string): string {
  const match = html.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1].replace(/\._[^.]+_/, "._SX200_") : "";
}

function extractAuthor(html: string): string {
  const match = html.match(/author:\s*([^<\n]+)/i);
  return match ? match[1].trim() : "";
}

function extractRating(html: string): string {
  const match = html.match(/(\d+) of 5 stars/);
  return match ? match[1] : "";
}
