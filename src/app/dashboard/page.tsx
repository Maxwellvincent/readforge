import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, wpmResult, carsResult, grammarResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("wpm_tests")
        .select("wpm, comprehension_score, tested_at, mode")
        .eq("user_id", user.id)
        .order("tested_at", { ascending: true })
        .limit(30),
      supabase
        .from("cars_sessions")
        .select("score_percent, completed_at, total_questions, correct_answers")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(10),
      supabase
        .from("grammar_progress")
        .select("module_id, completed, score")
        .eq("user_id", user.id),
    ]);

  return (
    <DashboardClient
      profile={profileResult.data}
      wpmHistory={wpmResult.data ?? []}
      carsHistory={carsResult.data ?? []}
      grammarProgress={grammarResult.data ?? []}
      userName={user.user_metadata?.full_name ?? user.email ?? ""}
    />
  );
}
