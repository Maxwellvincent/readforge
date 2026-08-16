"use client";

import { useState } from "react";
import {
  User, BookOpen, Zap, Target, Layers,
  CheckCircle, Loader2, BookMarked, Star, Link2, Unlink,
} from "lucide-react";
import { updateProfile } from "@/lib/db/client";
import type { Profile } from "@/lib/db/types";
import { levelLabel } from "@/lib/utils";
import type { ReadingLevel } from "@/types";

interface Props {
  profile: Profile | null;
  user: { email: string; id: string };
  readwiseConnected: boolean;
}

export function ProfileClient({ profile, user, readwiseConnected }: Props) {
  // Profile fields
  const [name, setName] = useState(profile?.fullName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Readwise — the token itself never reaches the browser; we only track status.
  const [rwConnected, setRwConnected] = useState(readwiseConnected);
  const [rwInput, setRwInput] = useState("");
  const [rwSaving, setRwSaving] = useState(false);
  const [rwError, setRwError] = useState("");
  const [rwSaved, setRwSaved] = useState(false);

  // Goodreads
  const [grUserId, setGrUserId] = useState(profile?.goodreadsUserId ?? "");
  const [grInput, setGrInput] = useState(profile?.goodreadsUserId ?? "");
  const [grSaving, setGrSaving] = useState(false);
  const [grSaved, setGrSaved] = useState(false);
  const [grError, setGrError] = useState("");

  async function saveProfile() {
    setSaving(true);
    await updateProfile(user.id, { fullName: name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function connectReadwise() {
    if (!rwInput.trim()) return;
    setRwSaving(true);
    setRwError("");
    // The server validates the token against Readwise and stores it in a
    // server-only document — it is never held in client state.
    const res = await fetch("/api/integrations/readwise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: rwInput.trim() }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      setRwError(data.error ?? "Could not connect Readwise");
      setRwSaving(false);
      return;
    }
    setRwConnected(true);
    setRwInput("");
    setRwSaved(true);
    setTimeout(() => setRwSaved(false), 2000);
    setRwSaving(false);
  }

  async function disconnectReadwise() {
    await fetch("/api/integrations/readwise", { method: "DELETE" });
    setRwConnected(false);
    setRwInput("");
  }

  async function saveGoodreads() {
    if (!grInput.trim()) return;
    setGrSaving(true);
    setGrError("");
    // Quick validation — fetch shelf
    const res = await fetch(`/api/goodreads?userId=${grInput.trim()}&shelf=currently-reading`);
    const data = await res.json();
    if (data.error) {
      setGrError(data.error);
      setGrSaving(false);
      return;
    }
    await updateProfile(user.id, { goodreadsUserId: grInput.trim() });
    setGrUserId(grInput.trim());
    setGrSaved(true);
    setTimeout(() => setGrSaved(false), 2000);
    setGrSaving(false);
  }

  async function disconnectGoodreads() {
    await updateProfile(user.id, { goodreadsUserId: null });
    setGrUserId("");
    setGrInput("");
  }

  const stats = [
    { label: "Current WPM", value: profile?.currentWpm ?? 200, icon: Zap, color: "text-[var(--sand-ink)]" },
    { label: "Articles Read", value: profile?.articlesRead ?? 0, icon: BookOpen, color: "text-[var(--sky-ink)]" },
    { label: "CARS Sessions", value: "—", icon: Target, color: "text-[var(--rose-ink)]" },
    { label: "Reading Level", value: levelLabel((profile?.readingLevel as ReadingLevel) ?? "college"), icon: Layers, color: "text-[var(--lilac-ink)]" },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile & Settings</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-[10px] p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Edit profile */}
      <div className="bg-card border border-border rounded-[10px] p-6 mb-6">
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
              className="w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
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

      {/* ── Connected Services ─────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-[10px] p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Link2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Connected Services</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Link external reading apps — your saved content appears in the Library automatically.
        </p>

        {/* Readwise */}
        <div className="border border-border rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-card border border-border rounded-lg flex items-center justify-center">
                <BookMarked className="w-4 h-4 text-[var(--rose-ink)]" />
              </div>
              <div>
                <p className="font-medium text-sm">Readwise</p>
                <p className="text-xs text-muted-foreground">Sync your Readwise Reader library</p>
              </div>
            </div>
            {rwConnected ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-[var(--sage-ink)]">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
                <button
                  onClick={disconnectReadwise}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 border border-border rounded-lg"
                >
                  <Unlink className="w-3 h-3" /> Disconnect
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-lg">Not connected</span>
            )}
          </div>
          {!rwConnected && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Get your access token at{" "}
                <a href="https://readwise.io/access_token" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  readwise.io/access_token
                </a>
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={rwInput}
                  onChange={(e) => setRwInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") connectReadwise(); }}
                  placeholder="Paste access token..."
                  className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={connectReadwise}
                  disabled={rwSaving || !rwInput.trim()}
                  className="bg-card border border-border text-[var(--rose-ink)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-card transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {rwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : rwSaved ? <CheckCircle className="w-4 h-4" /> : null}
                  {rwSaved ? "Connected!" : "Connect"}
                </button>
              </div>
              {rwError && <p className="text-xs text-destructive">{rwError}</p>}
            </div>
          )}
          {rwConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              Token saved · your Readwise library is available in the Library → Readwise tab
            </p>
          )}
        </div>

        {/* Goodreads */}
        <div className="border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-card border border-border rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-[var(--sand-ink)]" />
              </div>
              <div>
                <p className="font-medium text-sm">Goodreads</p>
                <p className="text-xs text-muted-foreground">Import your reading shelves</p>
              </div>
            </div>
            {grUserId ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-[var(--sage-ink)]">
                  <CheckCircle className="w-3.5 h-3.5" /> ID: {grUserId}
                </span>
                <button
                  onClick={disconnectGoodreads}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 border border-border rounded-lg"
                >
                  <Unlink className="w-3 h-3" /> Remove
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-lg">Not connected</span>
            )}
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Find your User ID in your Goodreads profile URL:{" "}
              <span className="font-mono text-primary/70">goodreads.com/user/show/<strong>12345678</strong></span>.
              Profile must be <strong>public</strong>.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={grInput}
                onChange={(e) => setGrInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveGoodreads(); }}
                placeholder="Goodreads User ID (e.g. 12345678)"
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={saveGoodreads}
                disabled={grSaving || !grInput.trim()}
                className="bg-card border border-border text-[var(--sand-ink)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-card transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {grSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : grSaved ? <CheckCircle className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                {grSaved ? "Saved!" : grUserId ? "Update" : "Connect"}
              </button>
            </div>
            {grError && <p className="text-xs text-destructive">{grError}</p>}
            {grUserId && !grError && (
              <p className="text-xs text-muted-foreground">Shelves available in Library → Goodreads tab</p>
            )}
          </div>
        </div>
      </div>

      {/* Cambridge Method Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-[10px] p-6">
        <h3 className="font-semibold mb-3">Your Learning Path</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>ReadForge uses the Cambridge Learning Center methodology — the same system used by top MCAT CARS scorers.</p>
          <p>Your path: <strong className="text-foreground">Grammar Foundation</strong> → <strong className="text-foreground">Rhetorical Cue Mastery</strong> → <strong className="text-foreground">Speed Building</strong> → <strong className="text-foreground">CARS Domination</strong></p>
        </div>
      </div>
    </div>
  );
}
