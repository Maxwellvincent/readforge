"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ChevronRight, ChevronLeft, Award, BookOpen } from "lucide-react";
import { GRAMMAR_MODULES } from "@/lib/cambridge/grammar-modules";
import type { GrammarLesson, GrammarDrill } from "@/types";
import { Suspense } from "react";

function GrammarContent() {
  const params = useSearchParams();
  const moduleParam = params.get("module");
  const [activeModule, setActiveModule] = useState(
    moduleParam ? parseInt(moduleParam) - 1 : 0
  );
  const [activeLesson, setActiveLesson] = useState(0);
  const [mode, setMode] = useState<"learn" | "drill">("learn");
  const [drillIndex, setDrillIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const currentModule = GRAMMAR_MODULES[activeModule];
  const currentLesson = currentModule?.lessons[activeLesson];
  const currentDrills = currentLesson?.drill ?? [];
  const currentDrill = currentDrills[drillIndex];

  function handleAnswer(choice: string) {
    if (showAnswer) return;
    setSelected(choice);
    setShowAnswer(true);
    const correct = choice === currentDrill.correctAnswer;
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
    if (correct) {
      setCompleted((prev) => new Set([...prev, currentDrill.id]));
    }
  }

  function nextDrill() {
    if (drillIndex < currentDrills.length - 1) {
      setDrillIndex(drillIndex + 1);
      setSelected(null);
      setShowAnswer(false);
    } else {
      setMode("learn");
      setDrillIndex(0);
      setSelected(null);
      setShowAnswer(false);
    }
  }

  return (
    <div className="flex min-h-screen max-h-screen overflow-hidden">
      {/* Module sidebar */}
      <div className="w-52 shrink-0 border-r border-border bg-card/50 overflow-y-auto py-4">
        <div className="px-4 mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Cambridge Modules
          </p>
        </div>
        {GRAMMAR_MODULES.map((mod, i) => {
          const done = completed.size > 0 && mod.lessons.every((l) =>
            l.drill.every((d) => completed.has(d.id))
          );
          return (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModule(i);
                setActiveLesson(0);
                setMode("learn");
                setDrillIndex(0);
                setSelected(null);
                setShowAnswer(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                activeModule === i
                  ? "bg-[color-mix(in_oklab,var(--sage)_28%,transparent)] text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-muted/50 border-l-2 border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    done
                      ? "bg-card text-[var(--sage-ink)]"
                      : activeModule === i
                      ? "bg-[color-mix(in_oklab,var(--sage)_28%,transparent)] text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : mod.number}
                </span>
                {mod.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Module header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{currentModule.cambridge_reference}</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              Module {currentModule.number}: {currentModule.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {currentModule.description}
            </p>
          </div>

          {/* Lesson tabs */}
          {currentModule.lessons.length > 1 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {currentModule.lessons.map((lesson, i) => (
                <button
                  key={lesson.id}
                  onClick={() => {
                    setActiveLesson(i);
                    setMode("learn");
                    setDrillIndex(0);
                    setSelected(null);
                    setShowAnswer(false);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    activeLesson === i
                      ? "bg-[color-mix(in_oklab,var(--sage)_28%,transparent)] border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {lesson.title}
                </button>
              ))}
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("learn")}
              className={`text-sm px-4 py-2 rounded-lg border font-medium transition-colors ${
                mode === "learn"
                  ? "bg-[color-mix(in_oklab,var(--sage)_28%,transparent)] border-primary/40 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              Learn
            </button>
            <button
              onClick={() => {
                setMode("drill");
                setDrillIndex(0);
                setSelected(null);
                setShowAnswer(false);
              }}
              className={`text-sm px-4 py-2 rounded-lg border font-medium transition-colors ${
                mode === "drill"
                  ? "bg-[color-mix(in_oklab,var(--sage)_28%,transparent)] border-primary/40 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              Drill ({currentDrills.length} questions)
            </button>
            {score.total > 0 && (
              <span className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                <Award className="w-4 h-4 text-[var(--sand-ink)]" />
                {score.correct}/{score.total} correct
              </span>
            )}
          </div>

          {/* LEARN MODE */}
          {mode === "learn" && currentLesson && (
            <LessonView lesson={currentLesson} />
          )}

          {/* DRILL MODE */}
          {mode === "drill" && currentDrill && (
            <DrillView
              drill={currentDrill}
              index={drillIndex}
              total={currentDrills.length}
              selected={selected}
              showAnswer={showAnswer}
              onAnswer={handleAnswer}
              onNext={nextDrill}
            />
          )}

          {mode === "drill" && !currentDrill && (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-[var(--sage-ink)] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Lesson Complete!</h3>
              <p className="text-muted-foreground">
                No drills available for this lesson yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LessonView({ lesson }: { lesson: GrammarLesson }) {
  return (
    <div>
      <div className="bg-card border border-border rounded-[10px] p-6 mb-5">
        <h2 className="text-lg font-semibold mb-1">{lesson.title}</h2>
        <p className="text-primary text-sm font-medium mb-4">{lesson.concept}</p>
        <div className="prose prose-invert prose-sm max-w-none">
          {lesson.explanation.split("\n\n").map((block, i) => (
            <div key={i} className="mb-4">
              {block.startsWith("**") ? (
                <div
                  className="text-sm leading-relaxed text-foreground/90"
                  dangerouslySetInnerHTML={{
                    __html: block
                      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*([^*]+)\*/g, "<em class='text-primary'>$1</em>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              ) : (
                <p
                  className="text-sm leading-relaxed text-foreground/90"
                  dangerouslySetInnerHTML={{
                    __html: block
                      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*([^*]+)\*/g, "<em class='text-primary'>$1</em>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {lesson.examples.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Examples</h3>
          {lesson.examples.map((ex, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5"
            >
              <p className="text-sm italic text-foreground mb-2">
                &ldquo;{ex.sentence}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                → {ex.analysis}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DrillView({
  drill,
  index,
  total,
  selected,
  showAnswer,
  onAnswer,
  onNext,
}: {
  drill: GrammarDrill;
  index: number;
  total: number;
  selected: string | null;
  showAnswer: boolean;
  onAnswer: (choice: string) => void;
  onNext: () => void;
}) {
  const isCorrect = selected === drill.correctAnswer;

  return (
    <div className="bg-card border border-border rounded-[10px] p-6">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {drill.type.replace(/-/g, " ")}
        </span>
        <span className="text-xs text-muted-foreground">
          {index + 1} / {total}
        </span>
      </div>

      <div className="mb-5 bg-muted/40 rounded-xl p-4">
        <p className="text-sm italic text-foreground">
          &ldquo;{drill.sentence}&rdquo;
        </p>
      </div>

      <p className="font-semibold mb-4">{drill.question}</p>

      {drill.choices && (
        <div className="space-y-2 mb-5">
          {drill.choices.map((choice) => {
            const isSelected = selected === choice;
            const isAnswer = choice === drill.correctAnswer;
            let style = "border-border text-foreground bg-background hover:border-primary/40";
            if (showAnswer && isAnswer)
              style = "border-border bg-card text-[var(--sage-ink)]";
            else if (showAnswer && isSelected && !isAnswer)
              style = "border-border bg-card text-[var(--rose-ink)]";
            else if (isSelected) style = "border-primary bg-[color-mix(in_oklab,var(--sage)_28%,transparent)] text-primary";

            return (
              <button
                key={choice}
                onClick={() => onAnswer(choice)}
                disabled={showAnswer}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${style}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {showAnswer && (
        <div
          className={`rounded-xl p-4 mb-4 text-sm ${
            isCorrect
              ? "bg-card border border-border text-[var(--sage-ink)]"
              : "bg-card border border-border text-[var(--rose-ink)]"
          }`}
        >
          <p className="font-semibold mb-1">
            {isCorrect ? "✓ Correct!" : `✗ The correct answer is: ${drill.correctAnswer}`}
          </p>
          <p className="text-xs opacity-80 leading-relaxed">{drill.explanation}</p>
        </div>
      )}

      {showAnswer && (
        <button
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          {index < total - 1 ? (
            <>
              Next Question <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Finish Lesson <CheckCircle className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function GrammarModuleClient() {
  return (
    <Suspense>
      <GrammarContent />
    </Suspense>
  );
}
