export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { LibraryClient } from "@/components/reader/LibraryClient";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let interests: string[] = [];
  let bookmarks: Record<string, unknown>[] = [];
  let userId: string | null = null;
  let readwiseToken: string | null = null;

  if (user) {
    userId = user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("interests, readwise_token")
      .eq("id", user.id)
      .single();

    interests = (profile?.interests as string[]) ?? [];
    readwiseToken = (profile?.readwise_token as string | null) ?? null;

    const { data: bmarks } = await supabase
      .from("bookmarks")
      .select("article_id, article_data, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    bookmarks = bmarks ?? [];
  }

  return (
    <LibraryClient
      userId={userId}
      initialInterests={interests}
      savedBookmarks={bookmarks}
      initialReadwiseToken={readwiseToken}
    />
  );
}
