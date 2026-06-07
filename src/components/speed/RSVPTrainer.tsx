"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, RotateCcw, ChevronLeft, ChevronRight,
  Zap, BookOpen, CheckCircle, TrendingUp, ArrowUp,
  Loader2, Maximize2, X, Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string | null;
  currentWpm: number;
  baselineWpm: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const SAMPLE_TEXTS: {
  title: string;
  level: string;
  source: string;
  text: string;
  quiz: QuizQuestion[];
}[] = [
  {
    title: "The Nature of Consciousness",
    level: "Graduate",
    source: "Philosophy of Mind",
    text: `Consciousness remains one of the most perplexing phenomena in science and philosophy. Despite remarkable advances in neuroscience, the hard problem of consciousness — why physical processes give rise to subjective experience — continues to challenge researchers. The brain processes information through billions of neurons firing in coordinated patterns, yet somewhere in this electrochemical symphony emerges the felt quality of experience: the redness of red, the sharpness of pain, the warmth of joy. Some philosophers argue that consciousness is an emergent property of sufficiently complex information processing systems. Others maintain that subjective experience is fundamentally irreducible to physical description, no matter how complete our understanding of brain mechanisms becomes. The debate has profound implications not only for philosophy of mind but for artificial intelligence, medicine, and our understanding of what it means to be human. If consciousness can emerge from physical processes, then it may be possible to create artificial consciousness. If it cannot, then something essential about human experience will forever elude computational simulation.`,
    quiz: [
      {
        question: "What do researchers call the 'hard problem' of consciousness?",
        options: [
          "Why the brain has billions of neurons",
          "Why physical processes give rise to subjective experience",
          "How to build artificial intelligence systems",
          "Why emotions are difficult to measure scientifically",
        ],
        correctIndex: 1,
      },
      {
        question: "What does the author suggest would be possible if consciousness emerges from physical processes?",
        options: [
          "Improved understanding of emotions",
          "Better treatments for neurological disease",
          "Creating artificial consciousness",
          "Solving the problem of chronic pain",
        ],
        correctIndex: 2,
      },
      {
        question: "Which of the following is an example of the 'felt quality of experience' mentioned?",
        options: [
          "Neural firing patterns in the cortex",
          "Electrochemical gradients across membranes",
          "The redness of red and the sharpness of pain",
          "Complex information processing algorithms",
        ],
        correctIndex: 2,
      },
      {
        question: "What do philosophers who reject the emergent view of consciousness believe?",
        options: [
          "Consciousness is a product of quantum mechanics",
          "Subjective experience cannot be reduced to physical description",
          "The brain is too simple to generate consciousness",
          "Consciousness exists only in humans",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    title: "The Political Economy of Climate",
    level: "College",
    source: "Policy Studies",
    text: `The transition to a low-carbon economy presents both extraordinary opportunities and significant structural challenges. Nations dependent on fossil fuel exports face potentially catastrophic economic disruption as renewable energy costs continue their dramatic decline. However, the assumption that environmental protection and economic development are inherently in tension represents a false dichotomy, one that has increasingly been challenged by empirical evidence. Countries that invested early in clean energy infrastructure have not only reduced emissions but created new industries, generated employment, and improved public health outcomes that translate into measurable economic gains. The distributional consequences of climate policy, however, remain deeply contested. Carbon pricing mechanisms, while economically efficient, can impose disproportionate burdens on lower-income households who spend a larger share of income on energy. This tension between efficiency and equity must be resolved through careful policy design if climate action is to achieve the broad political coalition necessary for implementation at the required scale and speed.`,
    quiz: [
      {
        question: "What does the author call a 'false dichotomy'?",
        options: [
          "The idea that carbon pricing hurts the poor",
          "The assumption that environmental protection and economic growth are inherently opposed",
          "The conflict between national and international climate policy",
          "The debate between solar and wind energy",
        ],
        correctIndex: 1,
      },
      {
        question: "What specific problem does the author identify with carbon pricing?",
        options: [
          "It is too politically unpopular to implement",
          "It does not actually reduce carbon emissions",
          "It can place disproportionate burdens on lower-income households",
          "It only works in highly developed economies",
        ],
        correctIndex: 2,
      },
      {
        question: "What have early clean energy investors gained beyond emissions reductions?",
        options: [
          "Geopolitical dominance over oil-exporting nations",
          "New industries, employment, and improved public health outcomes",
          "Exemptions from international climate agreements",
          "Reduced dependence on nuclear power",
        ],
        correctIndex: 1,
      },
      {
        question: "What does the author say climate action requires to succeed at scale?",
        options: [
          "Technological breakthroughs in energy storage",
          "Mandatory international treaties",
          "A broad political coalition",
          "Carbon taxes set at a global rate",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    title: "Narrative and Identity",
    level: "Professional",
    source: "Literary Theory",
    text: `The narrative self — the story we construct about who we are — is not a passive reflection of experience but an active, ongoing creation that shapes how we perceive and engage with the world. Philosophers from Aristotle to Paul Ricoeur have argued that identity is fundamentally temporal: we are not static entities but characters in a story that unfolds through time. This narrative understanding of selfhood has important implications for how we approach questions of moral responsibility, authenticity, and personal growth. The stories we tell about ourselves are always selective, always shaped by present concerns projected onto the past and anticipated futures. Memory, far from being a neutral archive, is reconstructive; each act of recall reshapes the remembered event according to current understanding and need. The self is thus not a substance but a process, not a fixed point but a moving center of narrative gravity around which experience coheres and through which meaning is made.`,
    quiz: [
      {
        question: "How does the author describe the narrative self?",
        options: [
          "A passive reflection of lived experience",
          "A biological record stored in long-term memory",
          "An active, ongoing creation that shapes perception",
          "A fixed identity established in childhood",
        ],
        correctIndex: 2,
      },
      {
        question: "Which philosophers does the author cite regarding temporal identity?",
        options: [
          "Plato and Immanuel Kant",
          "Aristotle and Paul Ricoeur",
          "Descartes and David Hume",
          "Nietzsche and Martin Heidegger",
        ],
        correctIndex: 1,
      },
      {
        question: "What does the author say about memory?",
        options: [
          "It is a neutral and reliable archive of the past",
          "It is entirely unreliable and should be distrusted",
          "It is reconstructive — reshaped with each act of recall",
          "It determines future behavior more than conscious thought",
        ],
        correctIndex: 2,
      },
      {
        question: "According to the passage, what is the self?",
        options: [
          "A fixed biological substance located in the brain",
          "A collection of unchanging memories",
          "Not a substance but a process — a moving center of narrative gravity",
          "A static entity that accumulates experience over time",
        ],
        correctIndex: 2,
      },
    ],
  },
];

function nextTarget(wpm: number): number {
  return Math.round((wpm * 1.1) / 25) * 25;
}

function wpmLabel(wpm: number): string {
  if (wpm < 150) return "Developing";
  if (wpm < 220) return "Average";
  if (wpm < 300) return "Good";
  if (wpm < 400) return "Advanced";
  if (wpm < 600) return "Expert";
  return "Elite";
}

const PIVOT_CHAR_RATIOS: Record<number, number> = {
  1: 0, 2: 0, 3: 0.3, 4: 0.3, 5: 0.3, 6: 0.35, 7: 0.35, 8: 0.4, 9: 0.4,
};

function getPivotIndex(word: string): number {
  const len = word.length;
  if (len <= 2) return 0;
  const ratio = PIVOT_CHAR_RATIOS[Math.min(len, 9)] ?? 0.4;
  return Math.round(len * ratio);
}

export function RSVPTrainer({ userId, currentWpm, baselineWpm }: Props) {
  const supabase = createClient();

  // Track current WPM locally so levelUp persists within session
  const [localCurrentWpm, setLocalCurrentWpm] = useState(currentWpm);

  const [selectedText, setSelectedText] = useState(0);
  const [customText, setCustomText] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const startWpm = Math.round(localCurrentWpm / 25) * 25;
  const [wpm, setWpm] = useState(startWpm);
  const [playing, setPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Focus mode (fullscreen modal)
  const [focusMode, setFocusMode] = useState(false);

  // Comprehension quiz
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [comprehensionScore, setComprehensionScore] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeText = useCustom ? customText : SAMPLE_TEXTS[selectedText].text;
  const activeQuiz = useCustom ? null : SAMPLE_TEXTS[selectedText].quiz;
  const words = activeText.trim().split(/\s+/).filter(Boolean);
  const currentWord = words[wordIndex] ?? "";
  const pivotIndex = getPivotIndex(currentWord);
  const msPerWord = Math.round((60 / wpm) * 1000);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    if (finished) { setWordIndex(0); setFinished(false); }
    setPlaying(true);
  }, [finished]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setWordIndex((prev) => {
          if (prev >= words.length - 1) {
            stop();
            setFinished(true);
            saveSession();
            return prev;
          }
          return prev + 1;
        });
      }, msPerWord);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, msPerWord, words.length, stop]);

  async function saveSession() {
    if (!userId) return;
    setSaving(true);
    await supabase.from("wpm_tests").insert({
      user_id: userId,
      wpm,
      mode: "rsvp",
    });
    setSaving(false);
    setSaved(true);
  }

  function reset() {
    stop();
    setWordIndex(0);
    setFinished(false);
    setShowQuiz(false);
    setQuizAnswers([null, null, null, null]);
    setQuizSubmitted(false);
    setComprehensionScore(null);
    setSaved(false);
  }

  function submitQuiz() {
    if (!activeQuiz) return;
    const correct = activeQuiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length;
    const score = Math.round((correct / activeQuiz.length) * 100);
    setComprehensionScore(score);
    setQuizSubmitted(true);
  }

  async function levelUp() {
    const next = nextTarget(wpm);
    // Save new WPM to profile
    if (userId) {
      await supabase.from("profiles")
        .update({ current_wpm: next })
        .eq("id", userId);
    }
    setLocalCurrentWpm(next);
    setWpm(next);
    reset();
  }

  const progress = words.length > 0 ? (wordIndex / words.length) * 100 : 0;
  const wpmGain = localCurrentWpm - baselineWpm;
  const target = nextTarget(wpm);

  // Comprehension gates level-up: need >= 70% to advance
  const passedComprehension = comprehensionScore !== null && comprehensionScore >= 70;
  const canLevelUp = quizSubmitted && passedComprehension;

  // The RSVP display — reused in both normal and focus mode
  function RSVPDisplay({ fullscreen = false }: { fullscreen?: boolean }) {
    return (
      <div className={`${fullscreen ? "flex flex-col items-center justify-center h-full" : ""}`}>
        <div className="w-full bg-muted rounded-full h-1 mb-8">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-center mb-2 min-h-[80px]">
          {words.length > 0 ? (
            <div className={`rsvp-display flex items-baseline ${fullscreen ? "text-5xl" : ""}`}>
              <span className="text-muted-foreground">
                {currentWord.slice(0, pivotIndex)}
              </span>
              <span className="rsvp-pivot">
                {currentWord[pivotIndex] ?? ""}
              </span>
              <span className="text-muted-foreground">
                {currentWord.slice(pivotIndex + 1)}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Select or paste a text to begin</p>
          )}
        </div>

        <p className={`text-xs text-muted-foreground mb-8 text-center ${fullscreen ? "text-sm" : ""}`}>
          {wordIndex + 1} / {words.length} · {wpm} WPM
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setWordIndex((p) => Math.max(0, p - 10))}
            disabled={wordIndex === 0}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:border-primary/40 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={playing ? stop : start}
            disabled={words.length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {playing ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" />{wordIndex > 0 && !finished ? "Resume" : "Start"}</>}
          </button>
          <button onClick={reset} className="p-2 rounded-lg border border-border text-muted-foreground hover:border-primary/40 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setWordIndex((p) => Math.min(words.length - 1, p + 10))}
            disabled={wordIndex >= words.length - 1}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:border-primary/40 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── FOCUS MODE MODAL ─────────────────────────────────────────── */}
      {focusMode && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-yellow-400">{wpm} WPM</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {useCustom ? "Custom Text" : SAMPLE_TEXTS[selectedText].title}
              </span>
            </div>
            <button
              onClick={() => { setFocusMode(false); if (!finished) stop(); }}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* RSVP content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-2xl mx-auto w-full">
            <RSVPDisplay fullscreen />
          </div>

          {/* Auto-close on finish */}
          {finished && (
            <div className="px-8 pb-8 text-center">
              <p className="text-emerald-400 font-semibold mb-3">✓ Session complete at {wpm} WPM</p>
              <button
                onClick={() => setFocusMode(false)}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                View Results & Test Comprehension
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── MAIN PAGE ────────────────────────────────────────────────── */}
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Speed Reading Trainer</h1>
            <p className="text-muted-foreground text-sm">
              RSVP — Rapid Serial Visual Presentation. Calibrated to your level.
            </p>
          </div>
          <button
            onClick={() => setFocusMode(true)}
            disabled={words.length === 0}
            className="flex items-center gap-2 border border-border rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40"
          >
            <Maximize2 className="w-4 h-4" /> Focus Mode
          </button>
        </div>

        {/* Adaptive Level Banner */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Baseline</p>
              <p className="text-lg font-bold">{baselineWpm} <span className="text-xs font-normal text-muted-foreground">WPM</span></p>
            </div>
            <TrendingUp className="w-4 h-4 text-primary" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Current</p>
              <p className="text-lg font-bold text-primary">{localCurrentWpm} <span className="text-xs font-normal text-muted-foreground">WPM</span></p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Next Target</p>
              <p className="text-lg font-bold text-yellow-400">{target} <span className="text-xs font-normal text-muted-foreground">WPM</span></p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">{wpmLabel(localCurrentWpm)}</span>
            {wpmGain > 0 && <span className="text-xs text-emerald-400">+{wpmGain} WPM from baseline</span>}
          </div>
        </div>

        {/* Text Selection */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Choose Your Text</h2>
          <div className="flex gap-2 flex-wrap mb-4">
            {SAMPLE_TEXTS.map((t, i) => (
              <button
                key={i}
                onClick={() => { setSelectedText(i); setUseCustom(false); reset(); }}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                  !useCustom && selectedText === i
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span className="font-medium">{t.title}</span>
                <span className="ml-1 opacity-60">· {t.level}</span>
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                useCustom
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              + Custom Text
            </button>
          </div>
          {useCustom && (
            <textarea
              value={customText}
              onChange={(e) => { setCustomText(e.target.value); reset(); }}
              placeholder="Paste any text here to practice speed reading..."
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors h-32 resize-none"
            />
          )}
          {!useCustom && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {SAMPLE_TEXTS[selectedText].text.slice(0, 120)}...
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {words.length} words · ~{Math.round(words.length / wpm)} min at {wpm} WPM
            {!useCustom && <span className="ml-2 text-primary/60">· comprehension quiz included</span>}
          </p>
        </div>

        {/* WPM Control */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold">Session Speed</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Pre-set to your current level — adjust to challenge yourself</p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">{wpm}</span>
              <span className="text-sm text-muted-foreground">WPM</span>
            </div>
          </div>
          <input
            type="range"
            min={100}
            max={1000}
            step={25}
            value={wpm}
            onChange={(e) => { setWpm(Number(e.target.value)); reset(); }}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>100</span>
            <span>300 (avg)</span>
            <span>600</span>
            <span>1000</span>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { label: "Comfort", value: Math.max(100, startWpm - 50) },
              { label: "Current", value: startWpm },
              { label: "Target", value: target },
              { label: "Push", value: Math.round((target * 1.1) / 25) * 25 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => { setWpm(preset.value); reset(); }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  wpm === preset.value
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {preset.label} · {preset.value}
              </button>
            ))}
          </div>
        </div>

        {/* RSVP Display */}
        <div className="bg-card border border-border rounded-2xl p-10 mb-6 text-center">
          <RSVPDisplay />
        </div>

        {/* ─── FINISHED STATE ─────────────────────────────────────────── */}
        {finished && (
          <div className="bg-card border border-primary/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {saving ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-primary" />
                )}
                <div>
                  <h3 className="text-xl font-bold">Session Complete — {wpm} WPM</h3>
                  <p className="text-xs text-muted-foreground">
                    {saved ? "Logged to your profile ✓" : saving ? "Saving..." : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Next target</p>
                <p className="text-lg font-bold text-yellow-400">{target} WPM</p>
              </div>
            </div>

            {/* Comprehension result (after quiz) */}
            {quizSubmitted && comprehensionScore !== null && (
              <div className={`rounded-xl p-4 mb-4 text-sm ${
                canLevelUp
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
              }`}>
                {canLevelUp ? (
                  <>
                    <p className="font-semibold mb-1">✓ {comprehensionScore}% comprehension — ready to level up!</p>
                    <p className="text-xs opacity-80">
                      You read {wpm} WPM with strong retention. Next target: <strong>{target} WPM</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold mb-1">
                      {comprehensionScore}% comprehension — keep building at this speed
                    </p>
                    <p className="text-xs opacity-80">
                      Need 70%+ comprehension to advance. Read {wpm} WPM again and focus on retention before leveling up.
                    </p>
                  </>
                )}
              </div>
            )}

            {!quizSubmitted && (
              <div className="bg-muted/40 rounded-xl p-4 mb-4 text-sm text-muted-foreground flex items-start gap-3">
                <Target className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <p>Speed alone isn&apos;t enough — test your comprehension below to unlock level-up. You need 70%+ to advance.</p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={reset}
                className="flex items-center gap-2 border border-border px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              {canLevelUp && (
                <button
                  onClick={levelUp}
                  className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-500/25 transition-colors"
                >
                  <ArrowUp className="w-4 h-4" /> Level Up to {target} WPM
                </button>
              )}
              {!showQuiz && activeQuiz && (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/25 transition-colors"
                >
                  <BookOpen className="w-4 h-4" /> Test Comprehension
                </button>
              )}
              {!activeQuiz && (
                <p className="text-xs text-muted-foreground self-center">
                  Use sample texts to unlock comprehension testing and level-up.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── COMPREHENSION QUIZ ─────────────────────────────────────── */}
        {showQuiz && activeQuiz && !quizSubmitted && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Comprehension Quiz</h3>
              <span className="text-xs text-muted-foreground ml-auto">4 questions · no scrolling back</span>
            </div>

            <div className="space-y-6">
              {activeQuiz.map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm font-medium mb-3">
                    <span className="text-primary font-bold mr-2">{qi + 1}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => {
                          const updated = [...quizAnswers];
                          updated[qi] = oi;
                          setQuizAnswers(updated);
                        }}
                        className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                          quizAnswers[qi] === oi
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        <span className="font-medium mr-2">{["A","B","C","D"][oi]}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={submitQuiz}
              disabled={quizAnswers.some((a) => a === null)}
              className="mt-6 w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              Submit Answers
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Answer all 4 questions · 70% or above unlocks level-up
            </p>
          </div>
        )}

        {/* Quiz answers revealed after submission */}
        {quizSubmitted && activeQuiz && showQuiz && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Quiz Results</h3>
              <span className={`text-xl font-bold ${comprehensionScore! >= 70 ? "text-emerald-400" : "text-yellow-400"}`}>
                {comprehensionScore}%
              </span>
            </div>
            <div className="space-y-4">
              {activeQuiz.map((q, qi) => {
                const userAnswer = quizAnswers[qi];
                const correct = userAnswer === q.correctIndex;
                return (
                  <div key={qi} className={`rounded-xl p-4 border text-sm ${correct ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                    <p className="font-medium mb-2">
                      {correct ? "✓" : "✗"} {q.question}
                    </p>
                    {!correct && userAnswer !== null && (
                      <p className="text-xs text-red-400 mb-1">
                        You chose: {q.options[userAnswer]}
                      </p>
                    )}
                    <p className="text-xs text-emerald-400">
                      Correct: {q.options[q.correctIndex]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-2 bg-muted/30 rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-3">Cambridge Speed Reading Protocol</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { tip: "Red letter = pivot point. Lock your eye here. Eliminates saccades (eye jumps) that slow reading.", icon: "🎯" },
              { tip: "Level up only after 70%+ comprehension at current speed. Speed without retention is wasted.", icon: "📈" },
              { tip: "Use Focus Mode for distraction-free training — fullscreen with nothing but the word.", icon: "🧠" },
              { tip: "MCAT CARS requires 400+ WPM with 80%+ comprehension under 90-minute pressure. Train there.", icon: "⏱️" },
            ].map((t, i) => (
              <div key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="text-base shrink-0">{t.icon}</span>
                <span>{t.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
