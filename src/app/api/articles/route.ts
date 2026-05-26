import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { RSS_FEEDS, articleFromRSSItem } from "@/lib/rss";
import type { Article } from "@/types";

const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "content:encoded"],
      ["media:content", "media:content", { keepArray: false }],
    ],
  },
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const level = searchParams.get("level");
  const topic = searchParams.get("topic");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const feeds = source
    ? RSS_FEEDS.filter((f) => f.name === source)
    : RSS_FEEDS;

  const articlePromises = feeds.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items
        .slice(0, 5)
        .map((item) => articleFromRSSItem(item, feed));
    } catch {
      return [] as Article[];
    }
  });

  const results = await Promise.allSettled(articlePromises);
  let articles: Article[] = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((a) => a.content.length > 200 || a.excerpt.length > 100);

  // Filter
  if (level) articles = articles.filter((a) => a.reading_level === level);
  if (topic)
    articles = articles.filter((a) =>
      a.topic.some((t) => t.toLowerCase().includes(topic.toLowerCase()))
    );

  // Sort by publish date desc
  articles.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return NextResponse.json(articles.slice(0, limit));
}
