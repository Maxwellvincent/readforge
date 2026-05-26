import Link from "next/link";
import { BookOpen, Zap, Brain, Target, TrendingUp, Layers } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Cambridge-Method Reader",
    description:
      "Every article analyzed using the Cambridge Learning methodology. Rhetorical cues highlighted. Key Clauses revealed. Subject→Verb→Complement broken down in one click.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Zap,
    title: "Speed Reading Trainer",
    description:
      "RSVP (Rapid Serial Visual Presentation) trainer from 100–1000 WPM. Focus-line mode. Track your WPM growth over time. Build reading reflexes.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Brain,
    title: "AI Comprehension Quizzes",
    description:
      "Claude AI generates comprehension questions calibrated to your level after every article. Literal, inferential, vocabulary-in-context, and author-purpose questions.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Target,
    title: "MCAT CARS Prep Mode",
    description:
      "Full 9-passage, 90-minute CARS sessions. All 8 question types: Main Idea, Key Idea, Inference, Support, Weaken, Analogy, Detail, Purpose — with detailed explanations.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: Layers,
    title: "Grammar Foundation",
    description:
      "10 interactive Cambridge modules: Parts of Speech → Sentence Anatomy → Clauses → Phrases → Rhetoric. The grammatical X-ray that makes every sentence instantly parseable.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: TrendingUp,
    title: "Article Library",
    description:
      "Curated articles from The Atlantic, NYRB, Aeon, Nautilus, Scientific American, and JSTOR Daily. Filtered by difficulty level, topic, and source.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
];

const stats = [
  { value: "9", label: "Article Sources" },
  { value: "10", label: "Grammar Modules" },
  { value: "8", label: "CARS Question Types" },
  { value: "1000", label: "Max WPM Training" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-bold tracking-tight">ReadForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-primary/20">
          <Zap className="w-3 h-3" />
          Cambridge Learning Center Methodology
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
          Read Faster.{" "}
          <span className="text-primary">Understand Deeper.</span>
          <br />
          Destroy CARS.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Built on the exact methodology used by Cambridge Learning Center — the
          gold standard for MCAT CARS preparation. Grammar-first. Rhetoric-driven.
          AI-powered. The platform that turns reading from a struggle into a
          superpower.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-base"
          >
            Start Training Free
          </Link>
          <Link
            href="/login"
            className="border border-border px-8 py-3 rounded-xl font-semibold hover:bg-muted/50 transition-colors text-base text-muted-foreground"
          >
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-foreground">{s.value}+</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cambridge Methodology callout */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-10">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">
              The Cambridge Learning Method
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Cambridge Learning Center discovered that reading comprehension
              failure starts at the sentence level — not the passage level. When
              you can&apos;t find the{" "}
              <span className="text-foreground font-medium">Key Clause</span>{" "}
              (Subject → Verb → Complement) of a complex sentence, you lose the
              thread entirely.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              ReadForge trains you to parse grammar at reflex speed, recognize{" "}
              <span className="text-orange-400 font-medium">contrast cues</span>,{" "}
              <span className="text-blue-400 font-medium">conclusion words</span>,{" "}
              <span className="text-yellow-400 font-medium">emphasis markers</span>,
              and understand essay morphology — so every passage becomes a
              structured argument you can disassemble at will.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-10 text-center">
          Everything You Need to Master Reading
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors"
            >
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Forge Your Reading?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Start with a free baseline assessment. See your WPM, comprehension
          score, and a personalized training roadmap in 10 minutes.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-primary text-primary-foreground px-10 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-base"
        >
          Begin Your Assessment
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>ReadForge</span>
          </div>
          <p>Built for MCAT CARS mastery</p>
        </div>
      </footer>
    </div>
  );
}
