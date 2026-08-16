"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import {
  Zap,
  BookOpen,
  Target,
  Layers,
  TrendingUp,
  Award,
  Flame,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

import type { CarsSession, GrammarProgress, Profile, WpmTest } from "@/lib/db/types";

interface Props {
  profile: Profile | null;
  wpmHistory: WpmTest[];
  carsHistory: CarsSession[];
  grammarProgress: GrammarProgress[];
  userName: string;
}

const GRAMMAR_MODULES = [
  "Parts of Speech",
  "Sentence Parts",
  "Clauses",
  "Phrases",
  "Rhetoric & Reading",
  "Tone & POV",
  "Arcane Passages",
  "Q&A Strategy",
  "Speed Reading",
  "Morning Ritual",
];

const QUICK_ACTIONS = [
  {
    href: "/library",
    label: "Read an Article",
    sublabel: "Cambridge-method overlay",
    icon: BookOpen,
    color: "text-[var(--sky-ink)]",
    bg: "bg-card hover:bg-card",
  },
  {
    href: "/speed",
    label: "Speed Drill",
    sublabel: "RSVP trainer",
    icon: Zap,
    color: "text-[var(--sand-ink)]",
    bg: "bg-card hover:bg-card",
  },
  {
    href: "/cars",
    label: "CARS Session",
    sublabel: "90-min timed mode",
    icon: Target,
    color: "text-[var(--rose-ink)]",
    bg: "bg-card hover:bg-card",
  },
  {
    href: "/grammar",
    label: "Grammar Drill",
    sublabel: "Cambridge modules",
    icon: Layers,
    color: "text-[var(--lilac-ink)]",
    bg: "bg-card hover:bg-card",
  },
];

export function DashboardClient({
  profile,
  wpmHistory,
  carsHistory,
  grammarProgress,
  userName,
}: Props) {
  const currentWpm = profile?.currentWpm ?? 200;
  const baselineWpm = profile?.baselineWpm ?? 200;
  const wpmGain = currentWpm - baselineWpm;
  const articlesRead = profile?.articlesRead ?? 0;
  const streakDays = profile?.streakDays ?? 0;
  const avgCarsScore =
    carsHistory.length > 0
      ? Math.round(
          carsHistory.reduce((s, c) => s + (c.scorePercent ?? 0), 0) /
            carsHistory.length
        )
      : 0;
  const modulesCompleted = grammarProgress.filter((g) => g.completed).length;

  const wpmChartData = wpmHistory.map((w) => ({
    date: format(new Date(w.testedAt), "MMM d"),
    wpm: w.wpm,
    comprehension: w.comprehensionScore,
  }));

  const radarData = [
    { subject: "Main Idea", score: 70 },
    { subject: "Inference", score: 55 },
    { subject: "Key Idea", score: 65 },
    { subject: "Detail", score: 80 },
    { subject: "Purpose", score: 60 },
    { subject: "Analogy", score: 45 },
  ];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (userName.split(" ")[0] || userName).split("@")[0];

  // Personalized recommendation based on baseline
  const lastComprehension = wpmHistory.length > 0 ? wpmHistory[0].comprehensionScore : null;
  const focusRec = (() => {
    if (currentWpm < 200) return {
      label: "Priority: Build Reading Speed",
      detail: "Your WPM is below 200. Start with RSVP Speed Training to develop fluency before tackling CARS.",
      href: "/speed",
      cta: "Open Speed Trainer",
      icon: Zap,
      color: "text-[var(--sand-ink)]",
      bg: "bg-card border-border",
    };
    if (lastComprehension !== null && lastComprehension < 75) return {
      label: "Priority: Strengthen Comprehension",
      detail: "Your comprehension score shows room to grow. Work through the Cambridge Grammar Foundation modules first.",
      href: "/grammar",
      cta: "Start Grammar Modules",
      icon: Layers,
      color: "text-[var(--lilac-ink)]",
      bg: "bg-card border-border",
    };
    if (carsHistory.length === 0) return {
      label: "Priority: Benchmark Your CARS",
      detail: "You have solid speed and comprehension. Run a CARS diagnostic to find which question types need work.",
      href: "/cars",
      cta: "Start CARS Session",
      icon: Target,
      color: "text-[var(--rose-ink)]",
      bg: "bg-card border-border",
    };
    return {
      label: "Keep the Momentum",
      detail: "Read an article with Cambridge Mode on to keep building analytical reading habits.",
      href: "/library",
      cta: "Open Article Library",
      icon: BookOpen,
      color: "text-[var(--sky-ink)]",
      bg: "bg-card border-border",
    };
  })();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">
          {greeting}, {firstName}
        </h1>
        <p className="text-muted-foreground">
          {streakDays > 0
            ? `${streakDays}-day streak — keep it going!`
            : "Start your reading session to begin your streak."}
        </p>
      </div>

      {/* Start Here Banner */}
      <Link
        href={focusRec.href}
        className={`flex items-center justify-between gap-4 ${focusRec.bg} border rounded-[10px] px-6 py-4 mb-8 group hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-4">
          <focusRec.icon className={`w-6 h-6 ${focusRec.color} shrink-0`} />
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${focusRec.color} mb-0.5`}>
              {focusRec.label}
            </p>
            <p className="text-sm text-muted-foreground">{focusRec.detail}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-medium ${focusRec.color} shrink-0`}>
          {focusRec.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Current WPM",
            value: currentWpm.toString(),
            sub:
              wpmGain > 0 ? `+${wpmGain} from baseline` : "No data yet",
            icon: Zap,
            color: "text-[var(--sand-ink)]",
          },
          {
            label: "CARS Average",
            value: avgCarsScore ? `${avgCarsScore}%` : "—",
            sub: `${carsHistory.length} sessions`,
            icon: Target,
            color: "text-[var(--rose-ink)]",
          },
          {
            label: "Articles Read",
            value: articlesRead.toString(),
            sub: "Total sessions",
            icon: BookOpen,
            color: "text-[var(--sky-ink)]",
          },
          {
            label: "Grammar Modules",
            value: `${modulesCompleted}/${GRAMMAR_MODULES.length}`,
            sub: "Cambridge method",
            icon: Layers,
            color: "text-[var(--lilac-ink)]",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-[10px] p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="label-caps">
                {s.label}
              </p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold mb-1">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* WPM Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[10px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">Reading Speed Progress</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                WPM over time
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          {wpmChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={wpmChartData}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: 12,
                    color: "var(--foreground)",
                    boxShadow: "none",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke="var(--sky-ink)"
                  strokeWidth={2}
                  dot={false}
                  name="WPM"
                />
                <Line
                  type="monotone"
                  dataKey="comprehension"
                  stroke="var(--sage-ink)"
                  strokeWidth={2}
                  dot={false}
                  name="Comprehension %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Complete a speed drill or read an article to see your progress
            </div>
          )}
        </div>

        {/* Skill Radar */}
        <div className="bg-card border border-border rounded-[10px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">CARS Skills</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                By question type
              </p>
            </div>
            <Award className="w-4 h-4 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="var(--sky-ink)"
                fill="var(--sky)"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions — list rows (label left, chevron right, hairline
          dividers) rather than a fourth identical card grid on one screen. */}
      <div className="mb-8">
        <h2 className="font-semibold mb-4">Start Training</h2>
        <div className="bg-card border border-border rounded-[10px] overflow-hidden">
          {QUICK_ACTIONS.map((a, i) => (
            <Link
              key={a.href}
              href={a.href}
              className={`group flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--sage)_14%,transparent)] ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <a.icon className={`w-4 h-4 shrink-0 ${a.color}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.sublabel}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      {/* Grammar Progress */}
      <div className="bg-card border border-border rounded-[10px] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold">Grammar Foundation</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cambridge Learning modules
            </p>
          </div>
          <Link
            href="/grammar"
            className="text-xs text-primary hover:underline"
          >
            Continue →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {GRAMMAR_MODULES.map((mod, i) => {
            const prog = grammarProgress.filter(
              (g) => g.moduleId === `module-${i + 1}`
            );
            const done = prog.some((g) => g.completed);
            return (
              <Link
                key={mod}
                href={`/grammar?module=${i + 1}`}
                className={`text-center p-3 rounded-[10px] border text-xs font-medium transition-colors duration-150 ${
                  done
                    ? "bg-[color-mix(in_oklab,var(--sage)_30%,transparent)] border-[var(--sage-ink)]/40 text-foreground"
                    : "bg-card border-border text-muted-foreground hover:border-[var(--sage-ink)]/40"
                }`}
              >
                <div className="text-lg mb-1">{done ? "✓" : i + 1}</div>
                {mod}
              </Link>
            );
          })}
        </div>
      </div>

      {/* CARS History */}
      {carsHistory.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-[10px] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Recent CARS Sessions</h2>
            <Link href="/cars" className="text-xs text-primary hover:underline">
              Practice →
            </Link>
          </div>
          <div className="space-y-2">
            {carsHistory.slice(0, 5).map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-4 h-4 text-[var(--rose-ink)]" />
                  <span className="text-sm">
                    {s.completedAt
                      ? format(new Date(s.completedAt), "MMM d, yyyy")
                      : "In Progress"}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold ${
                    (s.scorePercent ?? 0) >= 70
                      ? "text-[var(--sage-ink)]"
                      : "text-[var(--rose-ink)]"
                  }`}
                >
                  {s.scorePercent ?? 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
