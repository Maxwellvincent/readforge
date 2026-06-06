"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, Clock, BookOpen, RefreshCw, Bookmark, BookmarkCheck,
  Upload, X, Loader2, FileText, Plus, Sparkles, Globe, Library, Star
} from "lucide-react";
import type { Article, ReadingLevel } from "@/types";
import { levelLabel, levelBadgeColor, estimateReadTime, countWords, calculateFleschScore, fleschToLevel } from "@/lib/utils";
import { format } from "date-fns";
import { RSS_FEEDS } from "@/lib/rss";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string | null;
  initialInterests: string[];
  savedBookmarks: Record<string, unknown>[];
}

interface GutenbergBook {
  id: number;
  title: string;
  authors: { name: string; birth_year: number | null; death_year: number | null }[];
  subjects: string[];
  download_count: number;
  formats: Record<string, string>;
  bookshelves: string[];
}

interface GoodreadsBook {
  id: string;
  title: string;
  author: string;
  description: string;
  link: string;
  cover: string;
  rating: string;
  dateAdded: string;
  shelf: string;
}

interface OLBook {
  key: string;
  title: string;
  authors: string[];
  firstPublishYear: number | null;
  coverUrl: string | null;
  subjects: string[];
  ia: string | null;
  pages: number | null;
  hasFullText: boolean;
}

const ALL_INTERESTS = [
  "Philosophy", "Science", "History", "Medicine",
  "Technology", "Literature", "Psychology", "Economics",
  "Politics", "Environment", "Arts", "Biology",
  "Fiction", "Nonfiction", "Finance", "Self-Help",
];

const INTEREST_KEYWORDS: Record<string, string[]> = {
  Philosophy: ["philosophy", "ethics", "moral", "epistemology", "metaphysics", "logic", "consciousness"],
  Science: ["science", "research", "discovery", "physics", "chemistry", "astronomy", "quantum"],
  History: ["history", "historical", "ancient", "civilization", "war", "empire", "century"],
  Medicine: ["medicine", "medical", "health", "disease", "clinical", "patient", "therapy", "drug"],
  Technology: ["technology", "ai", "software", "digital", "computer", "internet", "algorithm", "data"],
  Literature: ["literature", "novel", "poetry", "fiction", "writer", "narrative", "story", "book"],
  Psychology: ["psychology", "mind", "behavior", "cognitive", "mental", "neuroscience", "brain"],
  Economics: ["economics", "economy", "market", "finance", "trade", "policy", "growth", "inequality"],
  Politics: ["politics", "government", "democracy", "election", "power", "law", "justice", "rights"],
  Environment: ["environment", "climate", "ecology", "nature", "carbon", "species", "ocean"],
  Arts: ["art", "music", "culture", "aesthetic", "museum", "painting", "architecture"],
  Biology: ["biology", "evolution", "gene", "organism", "cell", "species", "darwin", "ecology"],
  Fiction: ["fiction", "novel", "story", "character", "plot", "narrative", "fantasy", "drama"],
  Nonfiction: ["nonfiction", "memoir", "biography", "essay", "journalism", "investigation", "true story"],
  Finance: ["finance", "investing", "stocks", "wealth", "money", "portfolio", "market", "capital", "banking"],
  "Self-Help": ["self-help", "productivity", "habit", "mindset", "motivation", "success", "leadership", "growth"],
};

function articleMatchesInterests(article: Article, interests: string[]): boolean {
  if (interests.length === 0) return false;
  const text = `${article.title} ${article.excerpt} ${article.topic.join(" ")}`.toLowerCase();
  return interests.some((interest) =>
    (INTEREST_KEYWORDS[interest] ?? [interest.toLowerCase()]).some((kw) => text.includes(kw))
  );
}

type Tab = "foryou" | "all" | "saved" | "uploads" | "gutenberg" | "openlibrary" | "goodreads";

export function LibraryClient({ userId, initialInterests, savedBookmarks }: Props) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>(initialInterests.length > 0 ? "foryou" : "all");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<ReadingLevel | "all">("all");
  const [source, setSource] = useState("all");
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    new Set(savedBookmarks.map((b) => b.article_id as string))
  );
  const [bookmarkData, setBookmarkData] = useState<Article[]>(
    savedBookmarks.map((b) => b.article_data as unknown as Article)
  );

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAuthor, setUploadAuthor] = useState("");
  const [uploadText, setUploadText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [userDocs, setUserDocs] = useState<Record<string, unknown>[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Gutenberg state
  const [gutenbergSearch, setGutenbergSearch] = useState("");
  const [gutenbergBooks, setGutenbergBooks] = useState<GutenbergBook[]>([]);
  const [gutenbergLoading, setGutenbergLoading] = useState(false);
  const [loadingBookId, setLoadingBookId] = useState<number | null>(null);

  // Goodreads state
  const [goodreadsUserId, setGoodreadsUserId] = useState("");
  const [goodreadsShelf, setGoodreadsShelf] = useState<"currently-reading" | "to-read" | "read">("currently-reading");
  const [goodreadsBooks, setGoodreadsBooks] = useState<GoodreadsBook[]>([]);
  const [goodreadsLoading, setGoodreadsLoading] = useState(false);
  const [goodreadsError, setGoodreadsError] = useState("");

  // Open Library state
  const [olSearch, setOlSearch] = useState("");
  const [olBooks, setOlBooks] = useState<OLBook[]>([]);
  const [olLoading, setOlLoading] = useState(false);
  const [olLoadingId, setOlLoadingId] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "60" });
      if (level !== "all") params.set("level", level);
      if (source !== "all") params.set("source", source);
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [level, source]);

  const fetchUserDocs = useCallback(async () => {
    if (!userId) return;
    setDocsLoading(true);
    const { data } = await supabase
      .from("user_documents")
      .select("*")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });
    setUserDocs(data ?? []);
    setDocsLoading(false);
  }, [userId, supabase]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => { if (tab === "uploads") fetchUserDocs(); }, [tab, fetchUserDocs]);
  useEffect(() => {
    if (tab === "gutenberg" && gutenbergBooks.length === 0) fetchGutenbergPopular();
    if (tab === "openlibrary" && olBooks.length === 0) fetchOLPopular();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function fetchGutenbergPopular() {
    setGutenbergLoading(true);
    try {
      const res = await fetch("/api/gutenberg?mode=popular");
      const data = await res.json();
      setGutenbergBooks(Array.isArray(data) ? data : []);
    } catch { setGutenbergBooks([]); }
    finally { setGutenbergLoading(false); }
  }

  async function searchGutenberg(query: string) {
    setGutenbergLoading(true);
    try {
      const res = await fetch(`/api/gutenberg?mode=search&search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setGutenbergBooks(Array.isArray(data) ? data : []);
    } catch { setGutenbergBooks([]); }
    finally { setGutenbergLoading(false); }
  }

  async function openGutenbergBook(book: GutenbergBook) {
    setLoadingBookId(book.id);
    try {
      const res = await fetch(`/api/gutenberg?mode=text&id=${book.id}`);
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      const authorName = book.authors[0]?.name ?? "Unknown Author";
      const article: Article = {
        id: `gutenberg-${book.id}`,
        title: data.title ?? book.title,
        source: "Project Gutenberg",
        source_url: `https://www.gutenberg.org/ebooks/${book.id}`,
        content: data.excerpt,
        excerpt: data.excerpt.slice(0, 200) + "...",
        author: authorName,
        published_at: new Date().toISOString(),
        topic: book.subjects.slice(0, 3),
        reading_level: "college",
        flesch_score: 50,
        word_count: data.excerptWordCount,
        estimated_wpm: data.excerptWordCount,
        essay_type: "narrative",
        image_url: "",
        cached_at: new Date().toISOString(),
      };
      if (userId) logView(article.id);
      const url = `/library/${article.id}?data=${encodeURIComponent(JSON.stringify(article))}`;
      window.location.href = url;
    } catch { alert("Failed to load book text."); }
    finally { setLoadingBookId(null); }
  }

  async function fetchGoodreads() {
    if (!goodreadsUserId.trim()) return;
    setGoodreadsLoading(true);
    setGoodreadsError("");
    try {
      const res = await fetch(`/api/goodreads?userId=${goodreadsUserId.trim()}&shelf=${goodreadsShelf}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGoodreadsBooks(data.books ?? []);
    } catch (err: unknown) {
      setGoodreadsError(err instanceof Error ? err.message : "Failed to fetch shelf");
      setGoodreadsBooks([]);
    } finally { setGoodreadsLoading(false); }
  }

  async function fetchOLPopular() {
    setOlLoading(true);
    try {
      const res = await fetch("/api/openlibrary?mode=popular");
      const data = await res.json();
      setOlBooks(Array.isArray(data) ? data : []);
    } catch { setOlBooks([]); }
    finally { setOlLoading(false); }
  }

  async function searchOL(query: string) {
    setOlLoading(true);
    try {
      const res = await fetch(`/api/openlibrary?mode=search&search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setOlBooks(Array.isArray(data) ? data : []);
    } catch { setOlBooks([]); }
    finally { setOlLoading(false); }
  }

  async function openOLBook(book: OLBook) {
    if (!book.hasFullText || !book.ia) {
      window.open(`https://openlibrary.org${book.key}`, "_blank");
      return;
    }
    setOlLoadingId(book.key);
    try {
      const res = await fetch(`/api/openlibrary?mode=text&ia=${encodeURIComponent(book.ia)}`);
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      const article: Article = {
        id: `ol-${book.ia}`,
        title: data.title || book.title,
        source: "Open Library",
        source_url: `https://openlibrary.org${book.key}`,
        content: data.excerpt,
        excerpt: data.excerpt.slice(0, 200) + "...",
        author: data.author || book.authors.join(", "),
        published_at: new Date().toISOString(),
        topic: book.subjects.slice(0, 3),
        reading_level: "college",
        flesch_score: 50,
        word_count: data.excerptWordCount,
        estimated_wpm: data.excerptWordCount,
        essay_type: "narrative",
        image_url: book.coverUrl ?? "",
        cached_at: new Date().toISOString(),
      };
      if (userId) logView(article.id);
      window.location.href = `/library/${article.id}?data=${encodeURIComponent(JSON.stringify(article))}`;
    } catch { alert("Failed to load book text."); }
    finally { setOlLoadingId(null); }
  }

  async function saveInterests(updated: string[]) {
    setInterests(updated);
    if (!userId) return;
    await supabase.from("profiles").update({ interests: updated }).eq("id", userId);
  }

  async function toggleBookmark(article: Article) {
    if (!userId) return;
    const isBookmarked = bookmarkedIds.has(article.id);
    if (isBookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", userId).eq("article_id", article.id);
      setBookmarkedIds((prev) => { const n = new Set(prev); n.delete(article.id); return n; });
      setBookmarkData((prev) => prev.filter((a) => a.id !== article.id));
    } else {
      await supabase.from("bookmarks").upsert({
        user_id: userId,
        article_id: article.id,
        article_data: article as unknown as Record<string, unknown>,
      });
      setBookmarkedIds((prev) => new Set([...prev, article.id]));
      setBookmarkData((prev) => [article, ...prev]);
    }
  }

  async function logView(articleId: string) {
    if (!userId) return;
    await supabase.from("reading_sessions").insert({
      user_id: userId,
      article_id: articleId,
    }).then(() => {});
  }

  async function handleUpload() {
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("title", uploadTitle || (uploadFile?.name.replace(/\.[^/.]+$/, "") ?? "Untitled"));
    fd.append("author", uploadAuthor);
    if (uploadFile) fd.append("file", uploadFile);
    else fd.append("text", uploadText);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setShowUpload(false);
      setUploadTitle(""); setUploadAuthor(""); setUploadText(""); setUploadFile(null);
      setTab("uploads");
      fetchUserDocs();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Filter logic
  const searchLower = search.toLowerCase();
  const applySearch = (a: Article) =>
    !search ||
    a.title.toLowerCase().includes(searchLower) ||
    a.source.toLowerCase().includes(searchLower) ||
    a.topic.some((t) => t.toLowerCase().includes(searchLower));

  const applyLevel = (a: Article) => level === "all" || a.reading_level === level;

  const forYou = articles.filter((a) => articleMatchesInterests(a, interests) && applySearch(a) && applyLevel(a));
  const explore = articles.filter((a) => !articleMatchesInterests(a, interests) && applySearch(a) && applyLevel(a));
  const allFiltered = articles.filter((a) => applySearch(a) && applyLevel(a));
  const savedFiltered = bookmarkData.filter((a) => applySearch(a) && applyLevel(a));

  const TABS = [
    { id: "foryou" as Tab, label: "For You", icon: Sparkles, count: forYou.length },
    { id: "all" as Tab, label: "All Articles", icon: Globe, count: allFiltered.length },
    { id: "gutenberg" as Tab, label: "Gutenberg", icon: Library, count: 0 },
    { id: "openlibrary" as Tab, label: "Open Library", icon: BookOpen, count: 0 },
    { id: "goodreads" as Tab, label: "Goodreads", icon: Star, count: goodreadsBooks.length },
    { id: "saved" as Tab, label: "Saved", icon: Bookmark, count: bookmarkedIds.size },
    { id: "uploads" as Tab, label: "My Uploads", icon: Upload, count: userDocs.length },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Article Library</h1>
          <p className="text-muted-foreground text-sm">
            Live feeds · Gutenberg · Open Library · Goodreads · personalized by interests
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 text-sm bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors rounded-lg px-3 py-2"
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
          <button
            onClick={fetchArticles}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Interest chips */}
      <div className="mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Interests:</span>
          {interests.map((interest) => (
            <button
              key={interest}
              onClick={() => saveInterests(interests.filter((i) => i !== interest))}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors"
            >
              {interest} <X className="w-3 h-3" />
            </button>
          ))}
          <button
            onClick={() => setShowInterestPicker(!showInterestPicker)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus className="w-3 h-3" /> Add interest
          </button>
        </div>
        {showInterestPicker && (
          <div className="mt-3 flex flex-wrap gap-2 p-4 bg-card border border-border rounded-xl">
            {ALL_INTERESTS.filter((i) => !interests.includes(i)).map((interest) => (
              <button
                key={interest}
                onClick={() => {
                  saveInterests([...interests, interest]);
                  if (tab === "all" && interests.length === 0) setTab("foryou");
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
              >
                {interest}
              </button>
            ))}
            {interests.length === ALL_INTERESTS.length && (
              <p className="text-xs text-muted-foreground">All interests selected</p>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-primary/20" : "bg-muted"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles, topics, sources..."
            className="w-full bg-input border border-border rounded-lg pl-9 pr-3.5 py-2 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        {tab !== "uploads" && (
          <>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as ReadingLevel | "all")}
              className="bg-input border border-border rounded-lg px-3.5 py-2 text-sm outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Levels</option>
              {["elementary","middle","high-school","college","graduate","professional"].map((l) => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="bg-input border border-border rounded-lg px-3.5 py-2 text-sm outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Sources</option>
              {RSS_FEEDS.map((f) => (
                <option key={f.name} value={f.name}>{f.name}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Content by tab */}
      {tab === "foryou" && (
        <div className="space-y-8">
          {interests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">No interests set yet</p>
              <p className="text-sm">Add interests above to see personalized articles</p>
            </div>
          ) : (
            <>
              {/* Matched articles */}
              <div>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Based on your interests
                  <span className="text-xs text-muted-foreground font-normal">({forYou.length})</span>
                </h2>
                <ArticleGrid
                  articles={loading ? [] : forYou}
                  loading={loading}
                  empty="No matches for your interests in today's feed. Try refreshing."
                  bookmarkedIds={bookmarkedIds}
                  onBookmark={toggleBookmark}
                  onView={logView}
                />
              </div>
              {/* Explore outside comfort zone */}
              {!loading && explore.length > 0 && (
                <div>
                  <h2 className="font-semibold mb-1 text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Expand your horizons
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">Outside your usual interests — good for CARS breadth</p>
                  <ArticleGrid
                    articles={explore.slice(0, 9)}
                    loading={false}
                    empty=""
                    bookmarkedIds={bookmarkedIds}
                    onBookmark={toggleBookmark}
                    onView={logView}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "all" && (
        <ArticleGrid
          articles={loading ? [] : allFiltered}
          loading={loading}
          empty="No articles found. Try adjusting filters or refreshing."
          bookmarkedIds={bookmarkedIds}
          onBookmark={toggleBookmark}
          onView={logView}
        />
      )}

      {tab === "saved" && (
        bookmarkedIds.size === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">No saved articles yet</p>
            <p className="text-sm">Click the bookmark icon on any article to save it</p>
          </div>
        ) : (
          <ArticleGrid
            articles={savedFiltered}
            loading={false}
            empty="No saved articles match your search."
            bookmarkedIds={bookmarkedIds}
            onBookmark={toggleBookmark}
            onView={logView}
          />
        )
      )}

      {tab === "uploads" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{userDocs.length} uploaded document{userDocs.length !== 1 ? "s" : ""}</p>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 text-sm bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors rounded-lg px-3 py-1.5"
            >
              <Plus className="w-4 h-4" /> Upload New
            </button>
          </div>
          {docsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map((i) => <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-40" />)}
            </div>
          ) : userDocs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">No uploads yet</p>
              <p className="text-sm">Upload a PDF, text file, or paste content directly</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userDocs.map((doc) => {
                const d = doc as Record<string, unknown>;
                const article: Article = {
                  id: d.id as string,
                  title: d.title as string,
                  source: "My Uploads",
                  source_url: "",
                  content: d.content as string,
                  excerpt: (d.content as string).slice(0, 150) + "...",
                  author: (d.author as string) ?? "",
                  published_at: d.uploaded_at as string,
                  topic: [],
                  reading_level: (d.reading_level as string) as import("@/types").ReadingLevel,
                  flesch_score: d.flesch_score as number,
                  word_count: d.word_count as number,
                  estimated_wpm: d.word_count as number,
                  essay_type: "expository",
                  image_url: "",
                  cached_at: d.uploaded_at as string,
                };
                return (
                  <Link
                    key={d.id as string}
                    href={`/library/${article.id}?data=${encodeURIComponent(JSON.stringify(article))}`}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex flex-col"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelBadgeColor(article.reading_level)}`}>
                        {levelLabel(article.reading_level)}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {String(d.file_type ?? "FILE").toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors flex-1">
                      {String(d.title ?? "")}
                    </h3>
                    {!!d.author && <p className="text-xs text-muted-foreground mb-2">{String(d.author)}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{estimateReadTime(d.word_count as number)} min</span>
                      <span>{(d.word_count as number).toLocaleString()} words</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Upload Document</h2>
              <button onClick={() => { setShowUpload(false); setUploadError(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
                {uploadError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Document title (auto-detected from filename)"
                  className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Author <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={uploadAuthor}
                  onChange={(e) => setUploadAuthor(e.target.value)}
                  placeholder="e.g. David Hume"
                  className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* File upload OR paste */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Content</label>
                <div className="space-y-3">
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.txt,.md"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setUploadFile(f);
                        if (f) setUploadText("");
                      }}
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-primary">
                        <FileText className="w-4 h-4" />
                        {uploadFile.name}
                        <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); }} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Drop PDF, TXT, or MD file here</p>
                        <p className="text-xs mt-1">or click to browse</p>
                      </div>
                    )}
                  </div>
                  {!uploadFile && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">or paste text</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <textarea
                        value={uploadText}
                        onChange={(e) => setUploadText(e.target.value)}
                        placeholder="Paste article, book chapter, or any text here..."
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors h-32 resize-none"
                      />
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || (!uploadFile && uploadText.trim().length < 100)}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? "Processing..." : "Upload & Analyze"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUTENBERG */}
      {tab === "gutenberg" && (
        <div>
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={gutenbergSearch}
                onChange={(e) => setGutenbergSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && gutenbergSearch.trim()) searchGutenberg(gutenbergSearch); }}
                placeholder="Search 70,000+ free books (e.g. Nietzsche, Austen, Darwin)..."
                className="w-full bg-input border border-border rounded-lg pl-9 pr-3.5 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              onClick={() => gutenbergSearch.trim() ? searchGutenberg(gutenbergSearch) : fetchGutenbergPopular()}
              disabled={gutenbergLoading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {gutenbergLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {gutenbergSearch.trim() ? "Search" : "Popular"}
            </button>
          </div>

          {gutenbergLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map((i) => <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-44" />)}
            </div>
          ) : gutenbergBooks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Library className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Search for any author, title, or subject</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gutenbergBooks.map((book) => (
                <div key={book.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/40 transition-all">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Gutenberg
                    </span>
                    <span className="text-xs text-muted-foreground">#{book.download_count?.toLocaleString()} downloads</span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-1 flex-1 line-clamp-2">{book.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {book.authors.map((a) => a.name.split(", ").reverse().join(" ")).join(", ")}
                    {book.authors[0]?.birth_year && ` (${book.authors[0].birth_year}–${book.authors[0].death_year ?? ""})`}
                  </p>
                  {book.subjects.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                      {book.subjects.slice(0, 2).join(" · ")}
                    </p>
                  )}
                  <button
                    onClick={() => openGutenbergBook(book)}
                    disabled={loadingBookId === book.id}
                    className="w-full flex items-center justify-center gap-2 bg-primary/15 border border-primary/30 text-primary text-sm font-medium py-2 rounded-lg hover:bg-primary/25 transition-colors disabled:opacity-50"
                  >
                    {loadingBookId === book.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                    ) : (
                      <><BookOpen className="w-4 h-4" /> Read First 6,000 Words</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            70,000+ free public domain books · First 6,000 words loaded for Cambridge Mode reading
          </p>
        </div>
      )}

      {/* OPEN LIBRARY */}
      {tab === "openlibrary" && (
        <div>
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={olSearch}
                onChange={(e) => setOlSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && olSearch.trim()) searchOL(olSearch); }}
                placeholder="Search 20M+ books (e.g. Marcus Aurelius, Virginia Woolf, James Baldwin)..."
                className="w-full bg-input border border-border rounded-lg pl-9 pr-3.5 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              onClick={() => olSearch.trim() ? searchOL(olSearch) : fetchOLPopular()}
              disabled={olLoading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {olLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {olSearch.trim() ? "Search" : "Popular"}
            </button>
          </div>

          {olLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map((i) => <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-52" />)}
            </div>
          ) : olBooks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Search over 20 million books from the Open Library catalog</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {olBooks.map((book) => (
                <div key={book.key} className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/40 transition-all">
                  <div className="flex gap-3 mb-3">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-14 h-20 object-cover rounded-lg shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          Open Library
                        </span>
                        {book.hasFullText && (
                          <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                            Full Text
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {book.authors.slice(0, 2).join(", ")}
                        {book.firstPublishYear ? ` · ${book.firstPublishYear}` : ""}
                      </p>
                      {book.pages && (
                        <p className="text-xs text-muted-foreground mt-0.5">{book.pages} pages</p>
                      )}
                    </div>
                  </div>
                  {book.subjects.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                      {book.subjects.slice(0, 3).join(" · ")}
                    </p>
                  )}
                  <button
                    onClick={() => openOLBook(book)}
                    disabled={olLoadingId === book.key}
                    className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 mt-auto ${
                      book.hasFullText
                        ? "bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25"
                        : "bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {olLoadingId === book.key ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                    ) : book.hasFullText ? (
                      <><BookOpen className="w-4 h-4" /> Read First 6,000 Words</>
                    ) : (
                      <><Globe className="w-4 h-4" /> View on Open Library</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Open Library · 20M+ books · Green badge = full text available via Internet Archive
          </p>
        </div>
      )}

      {/* GOODREADS */}
      {tab === "goodreads" && (
        <div>
          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <h2 className="font-semibold mb-1">Connect Goodreads Shelf</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Goodreads profile must be <strong>public</strong>. Find your User ID in your profile URL:
              goodreads.com/user/show/<strong>12345678</strong>
            </p>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={goodreadsUserId}
                onChange={(e) => setGoodreadsUserId(e.target.value)}
                placeholder="Goodreads User ID (e.g. 12345678)"
                className="flex-1 min-w-[200px] bg-input border border-border rounded-lg px-3.5 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
              <select
                value={goodreadsShelf}
                onChange={(e) => setGoodreadsShelf(e.target.value as "currently-reading" | "to-read" | "read")}
                className="bg-input border border-border rounded-lg px-3.5 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="currently-reading">Currently Reading</option>
                <option value="to-read">Want to Read</option>
                <option value="read">Read</option>
              </select>
              <button
                onClick={fetchGoodreads}
                disabled={goodreadsLoading || !goodreadsUserId.trim()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {goodreadsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Fetch Shelf
              </button>
            </div>
            {goodreadsError && (
              <p className="text-sm text-destructive mt-3">{goodreadsError}</p>
            )}
          </div>

          {goodreadsBooks.length === 0 && !goodreadsLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">No shelf loaded yet</p>
              <p className="text-sm">Enter your Goodreads User ID above to import your shelf</p>
            </div>
          ) : goodreadsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map((i) => <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-44" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goodreadsBooks.map((book) => (
                <a
                  key={book.id}
                  href={book.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex gap-4"
                >
                  {book.cover && (
                    <img src={book.cover} alt={book.title} className="w-16 h-24 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                        Goodreads
                      </span>
                      {book.rating && (
                        <span className="text-xs text-yellow-400">{"★".repeat(Number(book.rating))}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    {book.author && <p className="text-xs text-muted-foreground mb-2">{book.author}</p>}
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{book.description}</p>
                    <p className="text-xs text-primary mt-2">Open on Goodreads →</p>
                  </div>
                </a>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Goodreads shows your reading list · upload the book via My Uploads to read it with Cambridge Mode
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Articles refresh live from RSS feeds · reading history logged automatically
      </p>
    </div>
  );
}

function ArticleGrid({
  articles, loading, empty, bookmarkedIds, onBookmark, onView
}: {
  articles: Article[];
  loading: boolean;
  empty: string;
  bookmarkedIds: Set<string>;
  onBookmark: (a: Article) => void;
  onView: (id: string) => void;
}) {
  if (loading) return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
          <div className="h-4 bg-muted rounded mb-3 w-3/4" />
          <div className="h-3 bg-muted rounded mb-2 w-1/2" />
          <div className="h-16 bg-muted rounded mb-4" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      ))}
    </div>
  );

  if (articles.length === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">{empty}</p>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isBookmarked={bookmarkedIds.has(article.id)}
          onBookmark={onBookmark}
          onView={onView}
        />
      ))}
    </div>
  );
}

function ArticleCard({
  article, isBookmarked, onBookmark, onView
}: {
  article: Article;
  isBookmarked: boolean;
  onBookmark: (a: Article) => void;
  onView: (id: string) => void;
}) {
  const readTime = estimateReadTime(article.word_count);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex flex-col relative">
      {/* Bookmark button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(article); }}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors z-10"
      >
        {isBookmarked
          ? <BookmarkCheck className="w-4 h-4 text-primary" />
          : <Bookmark className="w-4 h-4" />}
      </button>

      <Link
        href={`/library/${article.id}?data=${encodeURIComponent(JSON.stringify(article))}`}
        onClick={() => onView(article.id)}
        className="flex flex-col flex-1"
      >
        {article.image_url && (
          <div
            className="w-full h-28 rounded-xl bg-muted mb-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${article.image_url})` }}
          />
        )}
        <div className="flex items-start gap-2 mb-2 pr-7">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelBadgeColor(article.reading_level)}`}>
            {levelLabel(article.reading_level)}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate">
            {article.source}
          </span>
        </div>
        <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1 pr-4">
          {article.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{readTime} min
          </span>
          <span>Flesch {article.flesch_score}</span>
          {article.published_at && (
            <span className="ml-auto">{format(new Date(article.published_at), "MMM d")}</span>
          )}
        </div>
      </Link>
    </div>
  );
}
