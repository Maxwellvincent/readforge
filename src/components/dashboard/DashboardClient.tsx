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
} from "lucide-react";
import { format } from "date-fns";

interface Props {
  profile: Record<string, unknown> | null;
  wpmHistory: { wpm: number; comprehension_score: number; tested_at: string; mode: string }[];
  carsHistory: { score_percent: number; completed_at: string }[];
  grammarProgress: { module_id: string; completed: boolean; score: number }[];
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
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 hover:bg-indigo-500/20",
  },
  {
    href: "/speed",
    label: "Speed Drill",
    sublabel: "RSVP trainer",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
  },
  {
    href: "/cars",
    label: "CARS Session",
    sublabel: "90-min timed mode",
    icon: Target,
    color: "text-red-400",
    bg: "bg-red-500/10 hover:bg-red-500/20",
  },
  {
    href: "/grammar",
    label: "Grammar Drill",
    sublabel: "Cambridge modules",
    icon: Layers,
    color: "text-purple-400",
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
  },
];

export function DashboardClient({
  profile,
  wpmHistory,
  carsHistory,
  grammarProgress,
  userName,
}: Props) {
  const currentWpm = (profile?.current_wpm as number) ?? 200;
  const baselineWpm = (profile?.baseline_wpm as number) ?? 200;
  const wpmGain = currentWpm - baselineWpm;
  const articlesRead = (profile?.articles_read as number) ?? 0;
  const streakDays = (profile?.streak_days as number) ?? 0;
  const avgCarsScore =
    carsHistory.length > 0
      ? Math.round(
          carsHistory.reduce((s, c) => s + (c.score_percent ?? 0), 0) /
            carsHistory.length
        )
      : 0;
  const modulesCompleted = grammarProgress.filter((g) => g.completed).length;

  const wpmChartData = wpmHistory.map((w) => ({
    date: format(new Date(w.tested_at), "MMM d"),
    wpm: w.wpm,
    comprehension: w.comprehension_score,
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground">
          {streakDays > 0
            ? `${streakDays}-day streak — keep it going!`
            : "Start your reading session to begin your streak."}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Current WPM",
            value: currentWpm.toString(),
            sub:
              wpmGain > 0 ? `+${wpmGain} from baseline` : "No data yet",
            icon: Zap,
            color: "text-yellow-400",
          },
          {
            label: "CARS Average",
            value: avgCarsScore ? `${avgCarsScore}%` : "—",
            sub: `${carsHistory.length} sessions`,
            icon: Target,
            color: "text-red-400",
          },
          {
            label: "Articles Read",
            value: articlesRead.toString(),
            sub: "Total sessions",
            icon: BookOpen,
            color: "text-indigo-400",
          },
          {
            label: "Grammar Modules",
            value: `${modulesCompleted}/${GRAMMAR_MODULES.length}`,
            sub: "Cambridge method",
            icon: Layers,
            color: "text-purple-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
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
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
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
                  strokeDasharray="3 3"
                  stroke="oklch(0.22 0.01 264)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 264)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 264)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.11 0.01 264)",
                    border: "1px solid oklch(0.22 0.01 264)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke="oklch(0.60 0.22 264)"
                  strokeWidth={2}
                  dot={false}
                  name="WPM"
                />
                <Line
                  type="monotone"
                  dataKey="comprehension"
                  stroke="oklch(0.65 0.20 180)"
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
        <div className="bg-card border border-border rounded-2xl p-6">
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
              <PolarGrid stroke="oklch(0.22 0.01 264)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 9, fill: "oklch(0.50 0.01 264)" }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="oklch(0.60 0.22 264)"
                fill="oklch(0.60 0.22 264)"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="font-semibold mb-4">Start Training</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`${a.bg} border border-transparent hover:border-border rounded-2xl p-5 transition-all group`}
            >
              <a.icon className={`w-6 h-6 ${a.color} mb-3`} />
              <p className="font-semibold text-sm">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {a.sublabel}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Grammar Progress */}
      <div className="bg-card border border-border rounded-2xl p-6">
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
              (g) => g.module_id === `module-${i + 1}`
            );
            const done = prog.some((g) => g.completed);
            return (
              <Link
                key={mod}
                href={`/grammar?module=${i + 1}`}
                className={`text-center p-3 rounded-xl border text-xs font-medium transition-colors ${
                  done
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
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
        <div className="mt-6 bg-card border border-border rounded-2xl p-6">
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
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-sm">
                    {s.completed_at
                      ? format(new Date(s.completed_at), "MMM d, yyyy")
                      : "In Progress"}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold ${
                    (s.score_percent ?? 0) >= 70
                      ? "text-emerald-400"
                      : "text-orange-400"
                  }`}
                >
                  {s.score_percent ?? 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
