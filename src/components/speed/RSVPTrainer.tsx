"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  CheckCircle,
  TrendingUp,
  ArrowUp,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string | null;
  currentWpm: number;
  baselineWpm: number;
}

const SAMPLE_TEXTS = [
  {
    title: "The Nature of Consciousness",
    level: "Graduate",
    source: "Philosophy of Mind",
    text: `Consciousness remains one of the most perplexing phenomena in science and philosophy. Despite remarkable advances in neuroscience, the hard problem of consciousness — why physical processes give rise to subjective experience — continues to challenge researchers. The brain processes information through billions of neurons firing in coordinated patterns, yet somewhere in this electrochemical symphony emerges the felt quality of experience: the redness of red, the sharpness of pain, the warmth of joy. Some philosophers argue that consciousness is an emergent property of sufficiently complex information processing systems. Others maintain that subjective experience is fundamentally irreducible to physical description, no matter how complete our understanding of brain mechanisms becomes. The debate has profound implications not only for philosophy of mind but for artificial intelligence, medicine, and our understanding of what it means to be human. If consciousness can emerge from physical processes, then it may be possible to create artificial consciousness. If it cannot, then something essential about human experience will forever elude computational simulation.`,
  },
  {
    title: "The Political Economy of Climate",
    level: "College",
    source: "Policy Studies",
    text: `The transition to a low-carbon economy presents both extraordinary opportunities and significant structural challenges. Nations dependent on fossil fuel exports face potentially catastrophic economic disruption as renewable energy costs continue their dramatic decline. However, the assumption that environmental protection and economic development are inherently in tension represents a false dichotomy, one that has increasingly been challenged by empirical evidence. Countries that invested early in clean energy infrastructure have not only reduced emissions but created new industries, generated employment, and improved public health outcomes that translate into measurable economic gains. The distributional consequences of climate policy, however, remain deeply contested. Carbon pricing mechanisms, while economically efficient, can impose disproportionate burdens on lower-income households who spend a larger share of income on energy. This tension between efficiency and equity must be resolved through careful policy design if climate action is to achieve the broad political coalition necessary for implementation at the required scale and speed.`,
  },
  {
    title: "Narrative and Identity",
    level: "Professional",
    source: "Literary Theory",
    text: `The narrative self — the story we construct about who we are — is not a passive reflection of experience but an active, ongoing creation that shapes how we perceive and engage with the world. Philosophers from Aristotle to Paul Ricoeur have argued that identity is fundamentally temporal: we are not static entities but characters in a story that unfolds through time. This narrative understanding of selfhood has important implications for how we approach questions of moral responsibility, authenticity, and personal growth. The stories we tell about ourselves are always selective, always shaped by present concerns projected onto the past and anticipated futures. Memory, far from being a neutral archive, is reconstructive; each act of recall reshapes the remembered event according to current understanding and need. The self is thus not a substance but a process, not a fixed point but a moving center of narrative gravity around which experience coheres and through which meaning is made.`,
  },
];

// Adaptive step: 10% increment, snapped to nearest 25
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

  const [selectedText, setSelectedText] = useState(0);
  const [customText, setCustomText] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  // Start at user's current WPM, snapped to nearest 25
  const startWpm = Math.round(currentWpm / 25) * 25;
  const [wpm, setWpm] = useState(startWpm);
  const [playing, setPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [actualWpm, setActualWpm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sessionCount, setSessionCount] = useState(0); // sessions at this WPM
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeText = useCustom ? customText : SAMPLE_TEXTS[selectedText].text;
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
    if (!startTime) setStartTime(Date.now());
    setPlaying(true);
  }, [finished, startTime]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setWordIndex((prev) => {
          if (prev >= words.length - 1) {
            stop();
            setFinished(true);
            if (startTime) {
              const elapsed = (Date.now() - startTime) / 60000;
              const computed = Math.round(words.length / elapsed);
              setActualWpm(computed);
              saveResult(computed);
            }
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
  }, [playing, msPerWord, words.length, stop, startTime]);

  async function saveResult(completedWpm: number) {
    if (!userId) return;
    setSaving(true);
    const newBest = Math.max(completedWpm, currentWpm);

    await supabase.from("wpm_tests").insert({
      user_id: userId,
      wpm: completedWpm,
      mode: "rsvp",
    });

    // Update profile current_wpm if improved
    if (completedWpm > currentWpm) {
      await supabase.from("profiles")
        .update({ current_wpm: newBest })
        .eq("id", userId);
    }

    setSaving(false);
    setSaved(true);
    setSessionCount((c) => c + 1);
  }

  function reset() {
    stop();
    setWordIndex(0);
    setFinished(false);
    setShowQuiz(false);
    setStartTime(null);
    setActualWpm(null);
    setSaved(false);
  }

  function levelUp() {
    const next = nextTarget(wpm);
    setWpm(next);
    reset();
  }

  const progress = words.length > 0 ? (wordIndex / words.length) * 100 : 0;
  const wpmGain = currentWpm - baselineWpm;
  const target = nextTarget(wpm);

  // Adaptive verdict after completion
  const succeededAtSpeed = actualWpm !== null && actualWpm >= wpm * 0.9;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Speed Reading Trainer</h1>
        <p className="text-muted-foreground text-sm">
          RSVP — Rapid Serial Visual Presentation. Calibrated to your current level.
        </p>
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
            <p className="text-lg font-bold text-primary">{currentWpm} <span className="text-xs font-normal text-muted-foreground">WPM</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Next Target</p>
            <p className="text-lg font-bold text-yellow-400">{target} <span className="text-xs font-normal text-muted-foreground">WPM</span></p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">{wpmLabel(currentWpm)}</span>
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
        {/* Adaptive preset buttons */}
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
        <div className="w-full bg-muted rounded-full h-1 mb-8">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-center mb-2 min-h-[80px]">
          {words.length > 0 ? (
            <div className="rsvp-display flex items-baseline">
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
            <p className="text-muted-foreground text-sm">
              Select or paste a text above to begin
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-8">
          {wordIndex + 1} / {words.length}
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

      {/* Finished state — adaptive */}
      {finished && (
        <div className="bg-card border border-primary/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {saving ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <CheckCircle className="w-8 h-8 text-primary" />
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {actualWpm ? `${actualWpm} WPM` : "Complete!"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {saved ? "Saved to your profile ✓" : saving ? "Saving..." : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Session target</p>
              <p className="text-lg font-bold">{wpm} WPM</p>
            </div>
          </div>

          {/* Adaptive verdict */}
          {actualWpm !== null && (
            <div className={`rounded-xl p-4 mb-4 text-sm ${
              succeededAtSpeed
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
            }`}>
              {succeededAtSpeed ? (
                <div>
                  <p className="font-semibold mb-1">✓ Target achieved — ready to level up</p>
                  <p className="text-xs opacity-80">
                    You maintained {actualWpm} WPM. Your next training target is <strong>{target} WPM</strong>.
                    Complete one more session at {target} WPM with good comprehension to lock in that gain.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold mb-1">Keep building at this speed</p>
                  <p className="text-xs opacity-80">
                    You read {actualWpm} WPM vs {wpm} WPM target.
                    Repeat at this speed until you consistently hit {wpm}+ WPM before advancing.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={reset}
              className="flex items-center gap-2 border border-border px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            {succeededAtSpeed && (
              <button
                onClick={levelUp}
                className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-500/25 transition-colors"
              >
                <ArrowUp className="w-4 h-4" /> Level Up to {target} WPM
              </button>
            )}
            <button
              onClick={() => setShowQuiz(true)}
              className="flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/25 transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Test Comprehension
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 bg-muted/30 rounded-2xl p-5">
        <h3 className="font-semibold text-sm mb-3">Cambridge Speed Reading Protocol</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { tip: "Red letter = pivot point. Lock your eye here. Eliminates saccades (eye jumps) that slow reading.", icon: "🎯" },
            { tip: "Advance speed only after 3 consecutive sessions with 80%+ comprehension at current level.", icon: "📈" },
            { tip: "Analytical reading (Cambridge) + RSVP = both speed AND comprehension improve together.", icon: "🧠" },
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
  );
}
