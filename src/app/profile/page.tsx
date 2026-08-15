import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { getSessionUser } from "@/lib/firebase/session";
import { getProfile, hasReadwiseToken } from "@/lib/db/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [profile, readwiseConnected] = await Promise.all([
    getProfile(user.uid),
    hasReadwiseToken(user.uid),
  ]);

  return (
    <ProfileClient
      profile={profile}
      user={{ email: user.email ?? "", id: user.uid }}
      readwiseConnected={readwiseConnected}
    />
  );
}
