export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { RSVPTrainer } from "@/components/speed/RSVPTrainer";

export default async function SpeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentWpm = 200;
  let baselineWpm = 200;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_wpm, baseline_wpm")
      .eq("id", user.id)
      .single();

    if (profile) {
      currentWpm = profile.current_wpm ?? 200;
      baselineWpm = profile.baseline_wpm ?? 200;
    }
  }

  return (
    <RSVPTrainer
      userId={user?.id ?? null}
      currentWpm={currentWpm}
      baselineWpm={baselineWpm}
    />
  );
}
