"use client";

import { useSearchParams } from "next/navigation";
import { ArticleReader } from "@/components/reader/ArticleReader";
import type { Article } from "@/types";
import { Suspense } from "react";

function ReaderInner() {
  const params = useSearchParams();
  const data = params.get("data");
  let article: Article | null = null;
  try {
    if (data) article = JSON.parse(decodeURIComponent(data));
  } catch {}

  if (!article) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Article not found.
      </div>
    );
  }
  return <ArticleReader article={article} />;
}

export default function ArticleReaderPage() {
  return (
    <Suspense>
      <ReaderInner />
    </Suspense>
  );
}
