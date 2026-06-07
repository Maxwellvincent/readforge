import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export const dynamic = "force-dynamic";

// Domains that block scrapers — fall back to RSS excerpt for these
const BLOCKED_DOMAINS = [
  "nytimes.com", "wsj.com", "ft.com", "bloomberg.com",
  "washingtonpost.com", "newyorker.com",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Check if domain is known to block scrapers
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (BLOCKED_DOMAINS.some((d) => hostname.includes(d))) {
      return NextResponse.json(
        { error: "This publisher doesn't allow full-text access. Read the excerpt or visit their site.", blocked: true },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ReadForge/1.0; +https://readforge-one.vercel.app)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      // 10 second timeout via AbortSignal
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Publisher returned ${res.status}. Try visiting the site directly.` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      return NextResponse.json({ error: "Not an HTML page" }, { status: 422 });
    }

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const parsed = reader.parse();

    if (!parsed || !parsed.textContent || parsed.textContent.trim().length < 200) {
      return NextResponse.json(
        { error: "Could not extract article text. The publisher may require a subscription or login.", blocked: true },
        { status: 422 }
      );
    }

    // Clean up text
    const text = parsed.textContent
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .trim();

    return NextResponse.json({
      title: parsed.title ?? "",
      byline: parsed.byline ?? "",
      text,
      wordCount: text.split(/\s+/).length,
      siteName: parsed.siteName ?? "",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("timeout") || msg.includes("Timeout")) {
      return NextResponse.json(
        { error: "Request timed out. The publisher's site may be slow or unavailable." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch article. The publisher may block automated access." },
      { status: 502 }
    );
  }
}
