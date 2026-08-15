import { LibraryClient } from "@/components/reader/LibraryClient";
import { getSessionUser } from "@/lib/firebase/session";
import { getProfile, hasReadwiseToken, listBookmarks } from "@/lib/db/server";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <LibraryClient
        userId={null}
        initialInterests={[]}
        savedBookmarks={[]}
        readwiseConnected={false}
        initialGoodreadsUserId={null}
      />
    );
  }

  const [profile, bookmarks, readwiseConnected] = await Promise.all([
    getProfile(user.uid),
    listBookmarks(user.uid),
    hasReadwiseToken(user.uid),
  ]);

  return (
    <LibraryClient
      userId={user.uid}
      initialInterests={profile?.interests ?? []}
      savedBookmarks={bookmarks}
      readwiseConnected={readwiseConnected}
      initialGoodreadsUserId={profile?.goodreadsUserId ?? null}
    />
  );
}
