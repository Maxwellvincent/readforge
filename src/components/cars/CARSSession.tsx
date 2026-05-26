"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Clock,
  Brain,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import type { CARSQuestion } from "@/types";
import { formatTime } from "@/lib/utils";
import { detectRhetoricalCues, isKeySentence } from "@/lib/cambridge/rhetorical-cues";
import { splitIntoSentences } from "@/lib/cambridge/key-clause";

const BUILT_IN_PASSAGES = [
  {
    id: "p1",
    source: "Philosophy of Ethics",
    text: `The utilitarian tradition in ethics, beginning with Jeremy Bentham and refined by John Stuart Mill, holds that the morally correct action is the one that produces the greatest happiness for the greatest number. This seemingly straightforward principle conceals considerable complexity. What counts as happiness? Whose happiness counts, and how do we weigh competing claims? Mill's famous distinction between higher and lower pleasures attempted to address the concern that a perfectly satisfied pig might, on simple hedonistic grounds, be counted as living better than a dissatisfied Socrates. But this distinction introduces a qualitative judgment that sits uneasily within a framework otherwise committed to aggregating welfare impartially.

Contemporary critics have pressed further. The utilitarian calculus seems to permit, in principle, the sacrifice of individual rights for aggregate benefit. If harvesting the organs of one healthy person would save five dying patients, the utilitarian arithmetic appears favorable. Yet virtually everyone recoils from such a conclusion, suggesting that our moral intuitions track something beyond mere welfare maximization. Deontological theorists, following Kant, argue that persons are ends in themselves, never merely means, and that this dignity places absolute constraints on how we may be treated regardless of consequences.

The debate is not merely academic. Questions about distributive justice, criminal punishment, healthcare allocation, and environmental policy all turn on whether we assess outcomes aggregately or respect inviolable constraints on how individuals may be treated.`,
  },
  {
    id: "p2",
    source: "History of Science",
    text: `The Copernican revolution is typically characterized as a triumph of empirical observation over theological dogma. This narrative, while not entirely false, is considerably simplified. Copernicus himself was motivated as much by aesthetic and mathematical considerations as by new observations. The Ptolemaic system actually predicted celestial positions with reasonable accuracy. What troubled Copernicus was not its predictive failure but its mathematical inelegance.

The reception of heliocentrism also confounds the simple science-versus-religion narrative. Many of the most vigorous opponents of the Copernican model were fellow astronomers motivated by empirical objections — in particular, the failure to detect stellar parallax. The absence of detected parallax was a genuine scientific problem, not simply obscurantism.

What the Copernican case illustrates is less a conflict between science and religion than a more complex dynamic in which commitments to mathematical beauty, empirical fit, theological consistency, and disciplinary authority all intersected in ways that resist simple narrative reduction.`,
  },
  {
    id: "p3",
    source: "Literary Criticism",
    text: `The relationship between literature and moral knowledge has been contested since Plato's Republic, where the poet is famously expelled from the ideal city on the grounds that mimetic art corrupts the soul. Aristotle's reply in the Poetics, that tragedy achieves the catharsis of pity and fear, rehabilitates literature as a moral-psychological technology.

Contemporary debates reproduce this ancient tension. Martha Nussbaum argues that literature cultivates the moral imagination by extending our understanding of how lives can be shaped by circumstance. Novels, on this view, are training grounds for empathy and practical wisdom that abstract philosophical argument cannot develop.

Against this stands the objection that the moral effects of literature are empirically uncertain. Literary engagement may produce vivid imaginative experiences without generating the systematic understanding that philosophical analysis provides.`,
  },
];

type Phase = "intro" | "reading" | "questions" | "results";

function SessionContent() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode") ?? "practice";

  const [phase, setPhase] = useState<Phase>("intro");
  const [passageIndex, setPassageIndex] = useState(0);
  const [questions, setQuestions] = useState<CARSQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [cambridgeMode, setCambridgeMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(
    mode === "timed" ? 90 * 60 : 999999
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [allAnswers, setAllAnswers] = useState<
    { passageId: string; answers: Record<string, string>; questions: CARSQuestion[] }[]
  >([]);

  const passage = BUILT_IN_PASSAGES[passageIndex];

  // Timer
  useEffect(() => {
    if (phase === "questions" && mode === "timed") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            finishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current!);
    };
  }, [phase, mode]);

  async function startReading() {
    setPhase("reading");
    setLoadingQ(true);
    try {
      const res = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passage: passage.text, count: 6 }),
      });
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } finally {
      setLoadingQ(false);
    }
  }

  function startQuestions() {
    setPhase("questions");
    setCurrentQ(0);
    setAnswers({});
    setShowResult(false);
  }

  function selectAnswer(label: string) {
    if (showResult) return;
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: label }));
  }

  function submitAnswer() {
    setShowResult(true);
  }

  function nextQuestion() {
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      setShowResult(false);
    } else {
      // Save this passage's results
      setAllAnswers((prev) => [
        ...prev,
        { passageId: passage.id, answers, questions },
      ]);
      if (passageIndex < BUILT_IN_PASSAGES.length - 1 && mode !== "practice") {
        setPassageIndex((prev) => prev + 1);
        setPhase("intro");
        setQuestions([]);
        setAnswers({});
      } else {
        finishSession();
      }
    }
  }

  function finishSession() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("results");
  }

  const totalCorrect = allAnswers.reduce((sum, pa) => {
    return sum + pa.questions.filter((q) => pa.answers[q.id] === q.correctAnswer).length;
  }, 0);
  const totalQuestions = allAnswers.reduce((sum, pa) => sum + pa.questions.length, 0);
  const scorePercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Render passage with Cambridge highlights
  const renderPassage = () => {
    const paragraphs = passage.text.split("\n\n").filter(Boolean);
    return paragraphs.map((para, pi) => {
      const sentences = splitIntoSentences(para);
      return (
        <p key={pi} className="mb-5">
          {sentences.map((s, si) => {
            if (!cambridgeMode) return <span key={si}>{s} </span>;
            const keySent = isKeySentence(s);
            return (
              <span
                key={si}
                className={keySent ? "key-sentence inline-block mb-2 w-full" : ""}
              >
                {s}{" "}
              </span>
            );
          })}
        </p>
      );
    });
  };

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              CARS Session —{" "}
              {mode === "timed"
                ? "Timed"
                : mode === "diagnostic"
                ? "Diagnostic"
                : "Practice"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Passage {passageIndex + 1} of{" "}
              {mode === "practice" ? 1 : BUILT_IN_PASSAGES.length} ·{" "}
              {passage.source}
            </p>
          </div>
          {mode === "timed" && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-3">Cambridge Pre-Reading Checklist</h2>
          {[
            "Take 2-3 slow breaths. Clear your mind.",
            "Read the first sentence to identify the essay type.",
            "Look for the Main Idea in the thesis paragraph.",
            "Note all key sentences with rhetorical cues.",
            "Enable Cambridge Mode for visual guidance.",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <p className="text-sm">{item}</p>
            </div>
          ))}
        </div>

        <button
          onClick={startReading}
          disabled={loadingQ}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loadingQ ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating questions...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Begin Passage
            </>
          )}
        </button>
      </div>
    );
  }

  // ── READING ───────────────────────────────────────────────────────────────
  if (phase === "reading") {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-lg">
              Passage {passageIndex + 1}: {passage.source}
            </h2>
            <p className="text-xs text-muted-foreground">
              Read carefully. Find the Main Idea and Key Sentences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCambridgeMode(!cambridgeMode)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                cambridgeMode
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {cambridgeMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Cambridge Mode
            </button>
          </div>
        </div>

        {cambridgeMode && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
            Blue border = Key Sentence. Look for the Main Idea in the first paragraph.
          </div>
        )}

        <div className="reading-body mb-8">{renderPassage()}</div>

        <button
          onClick={startQuestions}
          disabled={questions.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {questions.length === 0 ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading questions...
            </>
          ) : (
            <>
              Start {questions.length} Questions
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    );
  }

  // ── QUESTIONS ─────────────────────────────────────────────────────────────
  if (phase === "questions" && questions.length > 0) {
    const q = questions[currentQ];
    const selected = answers[q.id];
    const isCorrect = selected === q.correctAnswer;

    return (
      <div className="max-w-3xl mx-auto p-8">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Q{currentQ + 1}/{questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-6 rounded-full transition-colors ${
                    i < currentQ
                      ? "bg-primary"
                      : i === currentQ
                      ? "bg-primary/60"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          {mode === "timed" && (
            <div className={`font-mono font-bold text-sm ${timeLeft < 300 ? "text-red-400" : "text-muted-foreground"}`}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Question */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <div className="flex items-start gap-3 mb-5">
            <span className="bg-primary/15 text-primary text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">
              {currentQ + 1}
            </span>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1 block">
                {q.type.replace(/-/g, " ")} · {q.difficulty}
              </span>
              <p className="font-medium leading-relaxed">{q.question}</p>
            </div>
          </div>

          <div className="space-y-2">
            {q.choices.map((choice) => {
              const isSelectedThis = selected === choice.label;
              const isAnswer = choice.label === q.correctAnswer;
              let style = "border-border text-foreground bg-background hover:border-primary/40 cursor-pointer";
              if (showResult && isAnswer) style = "border-emerald-500 bg-emerald-500/10 text-emerald-300 cursor-default";
              else if (showResult && isSelectedThis && !isAnswer) style = "border-red-500 bg-red-500/10 text-red-300 cursor-default";
              else if (isSelectedThis) style = "border-primary bg-primary/10 text-primary";

              return (
                <button
                  key={choice.label}
                  onClick={() => selectAnswer(choice.label)}
                  disabled={showResult}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm transition-colors ${style}`}
                >
                  <span className="font-bold shrink-0 mt-0.5 w-5">{choice.label}.</span>
                  <span>{choice.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {showResult && (
          <div className={`rounded-2xl p-5 mb-4 ${
            isCorrect
              ? "bg-emerald-500/10 border border-emerald-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-semibold ${isCorrect ? "text-emerald-300" : "text-red-300"}`}>
                {isCorrect ? "Correct!" : `Incorrect — Answer: ${q.correctAnswer}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {q.explanation}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {!showResult && selected && (
            <button
              onClick={submitAnswer}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Submit Answer
            </button>
          )}
          {showResult && (
            <button
              onClick={nextQuestion}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              {currentQ < questions.length - 1 ? (
                <>
                  Next Question <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Finish <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (phase === "results") {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="text-center mb-8">
          <div
            className={`text-6xl font-bold mb-3 ${
              scorePercent >= 70
                ? "text-emerald-400"
                : scorePercent >= 50
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {scorePercent}%
          </div>
          <p className="text-xl font-semibold mb-1">
            {totalCorrect} / {totalQuestions} correct
          </p>
          <p className="text-muted-foreground">
            {scorePercent >= 70
              ? "Strong performance! Keep reinforcing the methodology."
              : scorePercent >= 50
              ? "Good foundation. Focus on Cambridge key clause identification."
              : "Review Cambridge Modules 5–8 before your next session."}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/cars")}
            className="border border-border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Back to CARS Home
          </button>
          <button
            onClick={() => {
              setPhase("intro");
              setPassageIndex(0);
              setQuestions([]);
              setAnswers({});
              setAllAnswers([]);
              setShowResult(false);
            }}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export function CARSSession() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
