"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Clock, BookOpen, RefreshCw } from "lucide-react";
import type { Article, ReadingLevel } from "@/types";
import { levelLabel, levelBadgeColor, estimateReadTime } from "@/lib/utils";
import { format } from "date-fns";
import { RSS_FEEDS } from "@/lib/rss";

const LEVELS: { value: ReadingLevel | "all"; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "elementary", label: "Elementary" },
  { value: "middle", label: "Middle" },
  { value: "high-school", label: "High School" },
  { value: "college", label: "College" },
  { value: "graduate", label: "Graduate" },
  { value: "professional", label: "Professional" },
];

export function LibraryClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<ReadingLevel | "all">("all");
  const [source, setSource] = useState("all");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (level !== "all") params.set("level", level);
      if (source !== "all") params.set("source", source);
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(data);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [level, source]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const filtered = articles.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.source.toLowerCase().includes(search.toLowerCase()) ||
      a.topic.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Article Library</h1>
          <p className="text-muted-foreground text-sm">
            Curated reads from 9 sources, sorted by difficulty
          </p>
        </div>
        <button
          onClick={fetchArticles}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles, topics..."
            className="w-full bg-input border border-border rounded-lg pl-9 pr-3.5 py-2 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as ReadingLevel | "all")}
          className="bg-input border border-border rounded-lg px-3.5 py-2 text-sm outline-none focus:border-primary transition-colors"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="bg-input border border-border rounded-lg px-3.5 py-2 text-sm outline-none focus:border-primary transition-colors"
        >
          <option value="all">All Sources</option>
          {RSS_FEEDS.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-5 animate-pulse"
            >
              <div className="h-4 bg-muted rounded mb-3 w-3/4" />
              <div className="h-3 bg-muted rounded mb-2 w-1/2" />
              <div className="h-16 bg-muted rounded mb-4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No articles found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6 text-center">
        {filtered.length} articles from{" "}
        {[...new Set(filtered.map((a) => a.source))].length} sources
      </p>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const readTime = estimateReadTime(article.word_count);

  return (
    <Link
      href={`/library/${article.id}?data=${encodeURIComponent(JSON.stringify(article))}`}
      className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex flex-col"
    >
      {article.image_url && (
        <div
          className="w-full h-28 rounded-xl bg-muted mb-4 bg-cover bg-center"
          style={{ backgroundImage: `url(${article.image_url})` }}
        />
      )}
      <div className="flex items-start gap-2 mb-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelBadgeColor(article.reading_level)}`}
        >
          {levelLabel(article.reading_level)}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {article.source}
        </span>
      </div>
      <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
        {article.title}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {article.excerpt}
      </p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {readTime} min read
        </span>
        <span className="flex items-center gap-1">
          <Filter className="w-3 h-3" />
          {article.flesch_score} Flesch
        </span>
        {article.published_at && (
          <span className="ml-auto">
            {format(new Date(article.published_at), "MMM d")}
          </span>
        )}
      </div>
    </Link>
  );
}
