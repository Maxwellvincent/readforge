import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getSessionUser } from "@/lib/firebase/session";
import {
  getProfile,
  listCarsSessions,
  listGrammarProgress,
  listWpmTests,
} from "@/lib/db/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [profile, wpmHistory, carsHistory, grammarProgress] = await Promise.all([
    getProfile(user.uid),
    listWpmTests(user.uid, 30),
    listCarsSessions(user.uid, 10),
    listGrammarProgress(user.uid),
  ]);

  return (
    <DashboardClient
      profile={profile}
      wpmHistory={wpmHistory}
      carsHistory={carsHistory}
      grammarProgress={grammarProgress}
      userName={profile?.fullName ?? user.name ?? user.email ?? ""}
    />
  );
}
