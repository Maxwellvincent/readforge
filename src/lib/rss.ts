import type { Article, RSSFeed } from "@/types";
import { calculateFleschScore, fleschToLevel, countWords } from "./utils";
import { nanoid } from "nanoid";

export const RSS_FEEDS: RSSFeed[] = [
  {
    name: "The Atlantic",
    url: "https://www.theatlantic.com/feed/all/",
    category: "humanities",
    defaultTopics: ["culture", "politics", "ideas"],
  },
  {
    name: "Aeon",
    url: "https://aeon.co/feed.rss",
    category: "humanities",
    defaultTopics: ["philosophy", "psychology", "science"],
  },
  {
    name: "Nautilus",
    url: "https://nautil.us/feed/",
    category: "science",
    defaultTopics: ["science", "nature", "technology"],
  },
  {
    name: "NY Review of Books",
    url: "https://www.nybooks.com/feed/",
    category: "humanities",
    defaultTopics: ["literature", "culture", "arts"],
  },
  {
    name: "Scientific American",
    url: "https://rss.sciam.com/ScientificAmerican-Global",
    category: "science",
    defaultTopics: ["science", "medicine", "environment"],
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    category: "social-science",
    defaultTopics: ["society", "global", "politics"],
  },
  {
    name: "Arts & Letters Daily",
    url: "https://www.aldaily.com/feed/",
    category: "humanities",
    defaultTopics: ["philosophy", "literature", "arts"],
  },
  {
    name: "JSTOR Daily",
    url: "https://daily.jstor.org/feed/",
    category: "mcat",
    defaultTopics: ["history", "social-science", "arts"],
  },
  {
    name: "Smithsonian Magazine",
    url: "https://www.smithsonianmag.com/rss/latest_articles/",
    category: "social-science",
    defaultTopics: ["history", "science", "culture"],
  },
];

// Strips HTML tags and returns clean plaintext
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function articleFromRSSItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any,
  feed: RSSFeed
): Article {
  const rawContent = item["content:encoded"] || item.content || item.summary || "";
  const content = stripHtml(rawContent);
  const excerpt = stripHtml(item.summary || item.contentSnippet || "").slice(0, 300);
  const wordCount = countWords(content || excerpt);
  const fleschScore = content.length > 100 ? calculateFleschScore(content) : 50;
  const level = fleschToLevel(fleschScore);

  return {
    id: nanoid(),
    title: stripHtml(item.title || "Untitled"),
    source: feed.name,
    source_url: item.link || item.guid || "",
    content: content || excerpt,
    excerpt,
    author: item.author || item.creator || undefined,
    published_at: item.pubDate || item.isoDate || new Date().toISOString(),
    topic: feed.defaultTopics,
    reading_level: level,
    flesch_score: fleschScore,
    estimated_wpm: Math.ceil(wordCount / 250),
    word_count: wordCount,
    essay_type: "unknown",
    image_url: extractImage(item),
    cached_at: new Date().toISOString(),
  };
}

function extractImage(item: Record<string, unknown>): string | undefined {
  if (typeof item["media:content"] === "object" && item["media:content"] !== null) {
    const media = item["media:content"] as Record<string, unknown>;
    if (typeof media.url === "string") return media.url;
  }
  if (typeof item.enclosure === "object" && item.enclosure !== null) {
    const enc = item.enclosure as Record<string, unknown>;
    if (typeof enc.url === "string" && typeof enc.type === "string" &&
        enc.type.startsWith("image")) return enc.url;
  }
  const content = (item["content:encoded"] as string) || (item.content as string) || "";
  if (typeof content === "string") {
    const match = content.match(/<img[^>]+src="([^"]+)"/i);
    return match?.[1];
  }
  return undefined;
}
