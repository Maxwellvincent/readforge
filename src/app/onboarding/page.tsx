"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Timer, CheckCircle, ArrowRight, Loader2, Brain } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { addWpmTest, updateProfile } from "@/lib/db/client";
import { countWords } from "@/lib/utils";

const PASSAGE = {
  title: "The Nature of Attention",
  text: `The ability to sustain attention is one of the most powerful predictors of cognitive performance, yet it remains poorly understood by most people who wish to improve it. Attention is not a single faculty but a collection of overlapping mental processes that compete for limited neural resources. When we speak of "paying attention," we conflate at least three distinct systems: alerting, which prepares the brain for incoming stimuli; orienting, which selects relevant information from the environment; and executive control, which resolves conflicts between competing thoughts and impulses.

Research in cognitive neuroscience suggests that these systems are anatomically separable. The alerting network depends heavily on norepinephrine pathways originating in the locus coeruleus, while orienting relies on acetylcholine modulation of parietal and frontal cortex. Executive control, the system most relevant to deliberate reading comprehension, is associated with the anterior cingulate cortex and the prefrontal regions—areas that show the greatest variation between individuals and the greatest sensitivity to factors like sleep deprivation and chronic stress.

What this means practically is that the experience of "not being able to focus" is not monolithic. A person who struggles to initiate reading may have a different deficit than one who begins well but loses the thread midway through a dense paragraph. The former may benefit from environmental restructuring—removing distractions, establishing rituals—while the latter likely needs to develop metacognitive strategies: pausing to summarize, asking questions of the text, identifying the author's main claim before proceeding.

The good news is that attention, unlike raw intelligence, is substantially trainable. Studies using mindfulness-based interventions, deliberate reading practice, and even certain forms of video-game training have shown measurable improvements in sustained attention over periods as short as eight weeks. The mechanism appears to involve both structural changes in prefrontal grey matter and improved efficiency of fronto-parietal networks. Reading difficult texts regularly—texts that demand inference, tolerate ambiguity, and resist easy summarization—is among the most reliable methods known for building this capacity.`,
};

const WORD_COUNT = countWords(PASSAGE.text);

const QUESTIONS = [
  {
    q: "What is the main argument of this passage?",
    options: [
      "Attention is a single unified mental faculty that can be trained",
      "Attention comprises distinct systems, each trainable through targeted practice",
      "Executive control is the only attention system that matters for reading",
      "Sleep deprivation is the primary cause of poor reading comprehension",
    ],
    answer: 1,
    explanation: "Passage argues attention = multiple distinct systems (alerting, orienting, executive control), all trainable.",
  },
  {
    q: "According to the passage, someone who loses focus midway through a dense paragraph would benefit most from:",
    options: [
      "Removing environmental distractions",
      "Increasing norepinephrine through exercise",
      "Metacognitive strategies like pausing to summarize",
      "Reducing reading difficulty until stamina builds",
    ],
    answer: 2,
    explanation: "Passage distinguishes initiating focus (environment) from sustaining it (metacognitive strategies).",
  },
  {
    q: "The passage implies that reading difficult texts is valuable because:",
    options: [
      "It activates the locus coeruleus more than easy texts",
      "It builds executive attention through demanding inference and ambiguity",
      "It is the only proven method for improving prefrontal grey matter",
      "It trains the orienting network more than the alerting network",
    ],
    answer: 1,
    explanation: "Passage states texts that 'demand inference, tolerate ambiguity, resist easy summarization' build attentional capacity.",
  },
  {
    q: "Which statement is best supported by the passage?",
    options: [
      "Attention deficits are fixed traits that reflect underlying intelligence",
      "The three attention systems always fail together when focus breaks down",
      "Difficulty focusing can stem from different underlying attention subsystems",
      "Mindfulness is more effective than reading practice for improving attention",
    ],
    answer: 2,
    explanation: "Passage explicitly states 'not being able to focus is not monolithic' — different systems fail differently.",
  },
];

function wpmToLevel(wpm: number): string {
  if (wpm < 150) return "middle-school";
  if (wpm < 220) return "high-school";
  if (wpm < 300) return "college";
  if (wpm < 400) return "graduate";
  return "professional";
}

function levelLabel(level: string) {
  const map: Record<string, string> = {
    "middle-school": "Middle School",
    "high-school": "High School",
    college: "College",
    graduate: "Graduate",
    professional: "Professional",
  };
  return map[level] ?? "College";
}

type Phase = "intro" | "reading" | "questions" | "results";

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (phase === "reading") {
      const t = Date.now();
      setStartTime(t);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - t) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  function finishReading() {
    if (timerRef.current) clearInterval(timerRef.current);
    const seconds = (Date.now() - startTime) / 1000;
    const calculatedWpm = Math.round((WORD_COUNT / seconds) * 60);
    setWpm(calculatedWpm);
    setPhase("questions");
  }

  function selectAnswer(qi: number, ai: number) {
    if (submitted) return;
    setAnswers((prev) => { const n = [...prev]; n[qi] = ai; return n; });
  }

  async function submitAssessment() {
    setSubmitted(true);
    const correct = answers.filter((a, i) => a === QUESTIONS[i].answer).length;
    const comprehension = Math.round((correct / QUESTIONS.length) * 100);
    const level = wpmToLevel(wpm);

    setSaving(true);
    const user = getFirebaseAuth().currentUser;
    if (user) {
      await updateProfile(user.uid, {
        baselineWpm: wpm,
        currentWpm: wpm,
        readingLevel: level,
        onboardingComplete: true,
      });

      await addWpmTest(user.uid, {
        wpm,
        comprehensionScore: comprehension,
        mode: "normal",
      });
    }
    setSaving(false);
    setPhase("results");
  }

  const correctCount = answers.filter((a, i) => a === QUESTIONS[i].answer).length;
  const comprehension = Math.round((correctCount / QUESTIONS.length) * 100);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-primary" />
        <span className="font-bold tracking-tight">ReadForge</span>
        <span className="text-muted-foreground text-sm ml-2">Baseline Assessment</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* INTRO */}
        {phase === "intro" && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-3">Find Your Baseline</h1>
              <p className="text-muted-foreground leading-relaxed">
                Read a ~400-word passage at your natural pace. No tricks — just read
                normally. Then answer 4 comprehension questions. Takes about 3–5 minutes.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-left space-y-3">
              <p className="font-medium text-sm">What we measure:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex gap-2"><span className="text-primary">→</span> Reading speed (WPM)</div>
                <div className="flex gap-2"><span className="text-primary">→</span> Comprehension accuracy</div>
                <div className="flex gap-2"><span className="text-primary">→</span> Starting reading level</div>
              </div>
            </div>
            <button
              onClick={() => setPhase("reading")}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
            >
              Start Reading <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* READING */}
        {phase === "reading" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{PASSAGE.title}</h2>
              <div className="flex items-center gap-2 text-sm font-mono bg-card border border-border px-3 py-1.5 rounded-lg">
                <Timer className="w-3.5 h-3.5 text-primary" />
                {mins}:{secs.toString().padStart(2, "0")}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-8">
              <p className="reading-body whitespace-pre-line">{PASSAGE.text}</p>
            </div>
            <button
              onClick={finishReading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Done Reading <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* QUESTIONS */}
        {phase === "questions" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-1">Comprehension Check</h2>
              <p className="text-muted-foreground text-sm">4 questions on what you just read.</p>
            </div>

            {QUESTIONS.map((q, qi) => (
              <div key={qi} className="space-y-3">
                <p className="font-medium text-sm leading-relaxed">
                  <span className="text-primary font-bold">{qi + 1}.</span> {q.q}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, ai) => {
                    const selected = answers[qi] === ai;
                    const isCorrect = ai === q.answer;
                    let cls = "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ";
                    if (!submitted) {
                      cls += selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:border-primary/50";
                    } else {
                      if (isCorrect) cls += "border-border bg-card text-[var(--sage-ink)]";
                      else if (selected) cls += "border-border bg-card text-[var(--rose-ink)]";
                      else cls += "border-border bg-card text-muted-foreground";
                    }
                    return (
                      <button key={ai} className={cls} onClick={() => selectAnswer(qi, ai)}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <p className="text-xs text-muted-foreground pl-1">
                    <span className="text-primary font-medium">Why: </span>{q.explanation}
                  </p>
                )}
              </div>
            ))}

            {!submitted ? (
              <button
                onClick={submitAssessment}
                disabled={answers.some((a) => a === null) || saving}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Assessment
              </button>
            ) : (
              <button
                onClick={() => setPhase("results")}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                See Results <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* RESULTS */}
        {phase === "results" && (
          <div className="text-center space-y-8">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-[var(--sage-ink)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Baseline Set</h2>
              <p className="text-muted-foreground text-sm">Your training is calibrated. Time to forge.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="text-3xl font-bold text-primary mb-1">{wpm}</div>
                <div className="text-xs text-muted-foreground">WPM</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="text-3xl font-bold text-primary mb-1">{comprehension}%</div>
                <div className="text-xs text-muted-foreground">Comprehension</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="text-lg font-bold text-primary mb-1">{levelLabel(wpmToLevel(wpm))}</div>
                <div className="text-xs text-muted-foreground">Level</div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 text-left space-y-2">
              <p className="font-medium text-sm mb-3">What&apos;s next:</p>
              {wpm < 250 && <p className="text-sm text-muted-foreground">→ Start with <span className="text-foreground font-medium">Speed Training</span> to build WPM</p>}
              {comprehension < 75 && <p className="text-sm text-muted-foreground">→ Work through <span className="text-foreground font-medium">Grammar Modules</span> to sharpen comprehension</p>}
              <p className="text-sm text-muted-foreground">→ Try a <span className="text-foreground font-medium">CARS Practice Session</span> to benchmark MCAT reasoning</p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
