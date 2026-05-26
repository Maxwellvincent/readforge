"use client";

import { useState } from "react";
import { User, BookOpen, Zap, Target, Layers, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { levelLabel } from "@/lib/utils";
import type { ReadingLevel } from "@/types";

interface Props {
  profile: Record<string, unknown> | null;
  user: { email: string; id: string };
}

export function ProfileClient({ profile, user }: Props) {
  const supabase = createClient();
  const [name, setName] = useState((profile?.full_name as string) ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveProfile() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const stats = [
    { label: "Current WPM", value: (profile?.current_wpm as number) ?? 200, icon: Zap, color: "text-yellow-400" },
    { label: "Articles Read", value: (profile?.articles_read as number) ?? 0, icon: BookOpen, color: "text-indigo-400" },
    { label: "CARS Sessions", value: "—", icon: Target, color: "text-red-400" },
    { label: "Reading Level", value: levelLabel((profile?.reading_level as ReadingLevel) ?? "college"), icon: Layers, color: "text-purple-400" },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Edit profile */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{name || "No name set"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-sm opacity-60 cursor-not-allowed"
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Cambridge Method Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <h3 className="font-semibold mb-3">Your Learning Path</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>ReadForge uses the Cambridge Learning Center methodology — the same system used by top MCAT CARS scorers.</p>
          <p>Your path: <strong className="text-foreground">Grammar Foundation</strong> → <strong className="text-foreground">Rhetorical Cue Mastery</strong> → <strong className="text-foreground">Speed Building</strong> → <strong className="text-foreground">CARS Domination</strong></p>
        </div>
      </div>
    </div>
  );
}
