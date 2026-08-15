import { RSVPTrainer } from "@/components/speed/RSVPTrainer";
import { getSessionUser } from "@/lib/firebase/session";
import { getProfile } from "@/lib/db/server";

export const dynamic = "force-dynamic";

export default async function SpeedPage() {
  const user = await getSessionUser();
  const profile = user ? await getProfile(user.uid) : null;

  return (
    <RSVPTrainer
      userId={user?.uid ?? null}
      currentWpm={profile?.currentWpm ?? 200}
      baselineWpm={profile?.baselineWpm ?? 200}
    />
  );
}
