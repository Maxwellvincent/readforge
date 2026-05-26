"use client";

import Link from "next/link";
import { Target, Clock, Brain, Zap, ChevronRight, BookOpen } from "lucide-react";

const MODES = [
  {
    id: "practice",
    title: "Practice Mode",
    description: "Work through one passage at a time. No time pressure. Full explanations after each question.",
    icon: BookOpen,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "hover:border-indigo-500/40",
    badge: "Best for beginners",
  },
  {
    id: "timed",
    title: "Timed CARS Session",
    description: "Full MCAT simulation: 3 passages, 90-second reading per passage, 6 questions each. Cambridge stacking technique recommended.",
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "hover:border-yellow-500/40",
    badge: "MCAT simulation",
  },
  {
    id: "diagnostic",
    title: "Diagnostic Test",
    description: "Assess your current level across all 8 question types. Get a detailed skill breakdown.",
    icon: Target,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "hover:border-red-500/40",
    badge: "First-time users",
  },
];

const QUESTION_TYPES = [
  { type: "Main Idea", description: "What is the central argument/purpose?", icon: "🎯" },
  { type: "Key Idea", description: "What does paragraph X primarily establish?", icon: "🔑" },
  { type: "Support/Agree", description: "Which choice provides evidence FOR the claim?", icon: "✅" },
  { type: "Weaken/Contradict", description: "Which choice most challenges the argument?", icon: "❌" },
  { type: "Inference", description: "What can be concluded from the passage?", icon: "💡" },
  { type: "Analogy", description: "A is to B as C is to...?", icon: "🔗" },
  { type: "Detail", description: "According to the passage, X is described as...?", icon: "📋" },
  { type: "Purpose", description: "Why does the author mention X?", icon: "❓" },
];

export function CARSHome() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-6 h-6 text-red-400" />
          <h1 className="text-3xl font-bold">MCAT CARS Prep</h1>
        </div>
        <p className="text-muted-foreground">
          AI-powered CARS practice built on Cambridge Learning methodology.
          All 8 question types. Detailed explanations.
        </p>
      </div>

      {/* Cambridge methodology reminder */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-8">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Before You Begin: Cambridge Approach
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Analytical Reading</p>
            <p>Find the Key Clause in every key sentence. Strip to Subject → Verb → Complement. Note rhetorical cues.</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Stacking Strategy</p>
            <p>Identify harder vs. easier passages. Full analytical reading on harder; impressionistic on easier.</p>
          </div>
        </div>
      </div>

      {/* Mode selection */}
      <h2 className="font-semibold mb-4">Choose Your Mode</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {MODES.map((mode) => (
          <Link
            key={mode.id}
            href={`/cars/session?mode=${mode.id}`}
            className={`bg-card border border-border rounded-2xl p-6 ${mode.border} transition-all group`}
          >
            <div
              className={`w-10 h-10 ${mode.bg} rounded-xl flex items-center justify-center mb-4`}
            >
              <mode.icon className={`w-5 h-5 ${mode.color}`} />
            </div>
            <div className="inline-block text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground mb-2">
              {mode.badge}
            </div>
            <h3 className="font-semibold mb-2">{mode.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {mode.description}
            </p>
            <span className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
              Start <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        ))}
      </div>

      {/* Question types reference */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-1">8 CARS Question Types</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Foundations of Comprehension 30% · Reasoning Within Text 30% · Reasoning Beyond Text 40%
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {QUESTION_TYPES.map((qt) => (
            <div
              key={qt.type}
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl"
            >
              <span className="text-lg shrink-0">{qt.icon}</span>
              <div>
                <p className="text-sm font-medium">{qt.type}</p>
                <p className="text-xs text-muted-foreground">{qt.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro tips */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {[
          {
            icon: Zap,
            title: "Inference Questions",
            tip: "The correct answer requires the FEWEST logical steps from the text. Extreme interpretations are always wrong.",
            color: "text-yellow-400",
          },
          {
            icon: Target,
            title: "Main Idea Questions",
            tip: "Find the thesis paragraph. The main idea is most often in the conclusion sentence of the first paragraph.",
            color: "text-red-400",
          },
        ].map((tip) => (
          <div
            key={tip.title}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <tip.icon className={`w-4 h-4 ${tip.color}`} />
              <p className="font-semibold text-sm">{tip.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tip.tip}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
