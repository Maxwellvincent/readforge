"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Brain,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import type { Article, KeyClauseAnalysis, CARSQuestion } from "@/types";
import { RSVPModal } from "./RSVPModal";
import { detectRhetoricalCues, isKeySentence } from "@/lib/cambridge/rhetorical-cues";
import {
  analyzeKeyClause,
  splitIntoSentences,
  splitIntoParagraphs,
} from "@/lib/cambridge/key-clause";
import { levelLabel, levelBadgeColor, estimateReadTime } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  article: Article;
}

const CUE_COLORS: Record<string, string> = {
  contrast: "cue-contrast",
  conclusion: "cue-conclusion",
  emphasis: "cue-emphasis",
  enumeration: "cue-enumeration",
  addition: "cue-addition",
};

const CUE_LEGEND = [
  { type: "contrast", label: "Contrast", color: "cue-contrast" },
  { type: "conclusion", label: "Conclusion", color: "cue-conclusion" },
  { type: "emphasis", label: "Emphasis", color: "cue-emphasis" },
  { type: "enumeration", label: "Enumeration", color: "cue-enumeration" },
  { type: "addition", label: "Addition", color: "cue-addition" },
];

export function ArticleReader({ article }: Props) {
  const [cambridgeMode, setCambridgeMode] = useState(false);
  const [selectedSentence, setSelectedSentence] = useState<KeyClauseAnalysis | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [questions, setQuestions] = useState<CARSQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [expandedCue, setExpandedCue] = useState<string | null>(null);
  const startTime = useRef(Date.now());

  // RSVP mode
  const [rsvpOpen, setRsvpOpen] = useState(false);

  // Full article fetching
  const [fullText, setFullText] = useState<string | null>(null);
  const [fetchingFull, setFetchingFull] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchBlocked, setFetchBlocked] = useState(false);

  // Content is "short" if under 300 words — means RSS only gave excerpt
  const rssContent = article.content || article.excerpt || "";
  const rssWordCount = rssContent.split(/\s+/).filter(Boolean).length;
  const isShortContent = rssWordCount < 300;

  // Fetch full article on mount if content looks like just an excerpt
  useEffect(() => {
    if (isShortContent && article.source_url && !fullText && !fetchingFull && !fetchBlocked) {
      setFetchingFull(true);
      fetch(`/api/fetch-article?url=${encodeURIComponent(article.source_url)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setFetchError(data.error);
            setFetchBlocked(!!data.blocked);
          } else if (data.text) {
            setFullText(data.text);
          }
        })
        .catch(() => setFetchError("Failed to load full article."))
        .finally(() => setFetchingFull(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayContent = fullText ?? rssContent;
  const paragraphs = splitIntoParagraphs(displayContent);
  const readTime = estimateReadTime(displayContent.split(/\s+/).length);

  async function generateQuiz() {
    setLoadingQuiz(true);
    setQuizMode(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage: displayContent,
          mode: "comprehension",
          level: article.reading_level,
          count: 5,
        }),
      });
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } finally {
      setLoadingQuiz(false);
    }
  }

  function submitQuiz() {
    setShowResults(true);
  }

  const score = showResults
    ? questions.filter((q) => answers[q.id] === q.correctAnswer).length
    : 0;

  function handleSentenceClick(sentence: string) {
    if (!cambridgeMode) return;
    const analysis = analyzeKeyClause(sentence);
    setSelectedSentence(analysis);
  }

  function renderParagraph(paragraph: string, paraIndex: number) {
    const sentences = splitIntoSentences(paragraph);
    return (
      <p key={paraIndex} className="mb-6">
        {sentences.map((sentence, sentIdx) => {
          const key = `${paraIndex}-${sentIdx}`;
          const keySent = isKeySentence(sentence);
          const cues = detectRhetoricalCues(sentence);

          if (!cambridgeMode) {
            return <span key={key}>{sentence} </span>;
          }

          // In Cambridge mode: highlight cue words, mark key sentences
          const words = sentence.split(/\s+/);
          const highlightedWords = words.map((word, wi) => {
            const clean = word.toLowerCase().replace(/[^a-z'-]/g, "");
            const matchingCue = cues.find(
              (c) =>
                c.word.toLowerCase() === clean ||
                c.word.toLowerCase().split(/\s+/)[0] === clean
            );
            if (matchingCue) {
              return (
                <span
                  key={wi}
                  className={`cue-highlight ${CUE_COLORS[matchingCue.type] ?? ""} cursor-help`}
                  title={matchingCue.description}
                >
                  {word}{" "}
                </span>
              );
            }
            return <span key={wi}>{word} </span>;
          });

          return (
            <span
              key={key}
              className={`cursor-pointer transition-all ${
                keySent
                  ? "key-sentence inline-block mb-2 w-full rounded-r"
                  : ""
              }`}
              onClick={() => handleSentenceClick(sentence)}
              title={cambridgeMode ? "Click to analyze key clause" : undefined}
            >
              {highlightedWords}
            </span>
          );
        })}
      </p>
    );
  }

  return (
    <div className="min-h-screen">
      {/* RSVP overlay */}
      {rsvpOpen && (
        <RSVPModal
          text={displayContent}
          title={article.title}
          onClose={() => setRsvpOpen(false)}
        />
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href="/library"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Library
          </Link>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">
            ~{readTime} min read
          </span>
          <button
            onClick={() => setCambridgeMode(!cambridgeMode)}
            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              cambridgeMode
                ? "bg-primary/15 border-primary/40 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {cambridgeMode ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            Cambridge Mode
          </button>
          <button
            onClick={() => setRsvpOpen(true)}
            disabled={displayContent.split(/\s+/).length < 10}
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card text-[var(--sand-ink)] hover:bg-card transition-colors disabled:opacity-40"
          >
            <Zap className="w-3.5 h-3.5" />
            RSVP
          </button>
          <button
            onClick={generateQuiz}
            disabled={loadingQuiz}
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
          >
            <Brain className="w-3.5 h-3.5" />
            {loadingQuiz ? "Generating..." : "Quiz Me"}
          </button>
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Article meta */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${levelBadgeColor(article.reading_level)}`}
            >
              {levelLabel(article.reading_level)}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {article.source}
            </span>
            {article.topic.map((t) => (
              <span
                key={t}
                className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3 max-w-[22ch] text-balance">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {article.author && <span>{article.author}</span>}
            {article.published_at && (
              <span>{format(new Date(article.published_at), "MMMM d, yyyy")}</span>
            )}
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Flesch {article.flesch_score}
            </span>
          </div>
        </div>

        {/* Cambridge Mode Legend */}
        {cambridgeMode && (
          <div className="mb-6 bg-card border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Cambridge Mode Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Key sentences have a blue left border. Click any sentence to
              analyze its Key Clause (Subject → Verb → Complement). Rhetorical
              cues are color-coded:
            </p>
            <div className="flex flex-wrap gap-2">
              {CUE_LEGEND.map((c) => (
                <span key={c.type} className={`text-xs px-2 py-0.5 rounded ${c.color}`}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key Clause Panel */}
        {cambridgeMode && selectedSentence && (
          <div className="mb-6 bg-primary/5 border border-primary/30 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary">
                Key Clause Analysis
              </h3>
              <button
                onClick={() => setSelectedSentence(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed">
              &ldquo;{selectedSentence.sentence}&rdquo;
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Subject", value: selectedSentence.subject, color: "text-[var(--sand-ink)]" },
                { label: "Verb", value: selectedSentence.verb, color: "text-[var(--rose-ink)]" },
                { label: "Complement", value: selectedSentence.complement?.slice(0, 60) + "...", color: "text-[var(--sage-ink)]" },
              ].map((item) => (
                <div key={item.label} className="bg-background rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.color}`}>
                    {item.value || "—"}
                  </p>
                </div>
              ))}
            </div>
            {selectedSentence.modifiers.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Key Modifiers:
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedSentence.modifiers.map((m, i) => (
                    <span
                      key={i}
                      className="text-xs bg-muted px-2 py-0.5 rounded-full"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedSentence.rhetoricalCues.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">
                  Rhetorical Cues Detected:
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedSentence.rhetoricalCues.map((c, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded ${CUE_COLORS[c.type] ?? ""}`}
                    >
                      {c.type}: &ldquo;{c.word}&rdquo;
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full-text fetch status */}
        {fetchingFull && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground bg-card border border-border rounded-xl px-5 py-4 mb-6">
            <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading full article from publisher...
          </div>
        )}
        {!fetchingFull && fetchError && (
          <div className="bg-card border border-border rounded-xl px-5 py-4 mb-6 text-sm">
            <p className="text-muted-foreground mb-2">{fetchError}</p>
            {fetchBlocked ? (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs hover:underline"
              >
                Read full article on {article.source} →
              </a>
            ) : null}
            <p className="text-xs text-muted-foreground mt-2 opacity-60">Showing excerpt below.</p>
          </div>
        )}
        {!fetchingFull && fullText && (
          <div className="flex items-center gap-2 text-xs text-[var(--sage-ink)] mb-6">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Full article loaded from {article.source}
          </div>
        )}

        {/* Article Body */}
        {!quizMode && (
          <div className="reading-body mx-auto">
            {paragraphs.map((para, i) => renderParagraph(para, i))}
          </div>
        )}

        {/* Quiz Mode */}
        {quizMode && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Comprehension Quiz</h2>
              <button
                onClick={() => {
                  setQuizMode(false);
                  setShowResults(false);
                  setAnswers({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to Article
              </button>
            </div>

            {loadingQuiz ? (
              <div className="text-center py-16 text-muted-foreground">
                <Brain className="w-8 h-8 mx-auto mb-3 animate-pulse text-primary" />
                <p>Claude is generating your comprehension questions...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((q, qi) => (
                  <QuizQuestion
                    key={q.id}
                    question={q}
                    index={qi + 1}
                    selected={answers[q.id]}
                    showResult={showResults}
                    onSelect={(choice) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: choice }))
                    }
                  />
                ))}

                {!showResults && questions.length > 0 && (
                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(answers).length < questions.length}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Submit Quiz
                  </button>
                )}

                {showResults && (
                  <div className="bg-card border border-border rounded-[10px] p-6 text-center">
                    <div
                      className={`text-5xl font-bold mb-2 ${
                        score / questions.length >= 0.8
                          ? "text-[var(--sage-ink)]"
                          : score / questions.length >= 0.6
                          ? "text-[var(--sand-ink)]"
                          : "text-[var(--rose-ink)]"
                      }`}
                    >
                      {score}/{questions.length}
                    </div>
                    <p className="text-muted-foreground">
                      {Math.round((score / questions.length) * 100)}% comprehension
                    </p>
                    {score / questions.length < 0.7 && (
                      <p className="text-sm text-muted-foreground mt-3">
                        Re-read the article in Cambridge Mode to identify key
                        sentences and rhetorical cues.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizQuestion({
  question,
  index,
  selected,
  showResult,
  onSelect,
}: {
  question: CARSQuestion;
  index: number;
  selected?: string;
  showResult: boolean;
  onSelect: (choice: string) => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const isCorrect = selected === question.correctAnswer;

  return (
    <div className="bg-card border border-border rounded-[10px] p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="bg-primary/15 text-primary text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          {index}
        </span>
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1 block">
            {question.type.replace("-", " ")}
          </span>
          <p className="text-sm font-medium leading-relaxed">{question.question}</p>
        </div>
      </div>
      <div className="space-y-2">
        {question.choices.map((choice) => {
          const isSelected = selected === choice.label;
          const isAnswer = choice.label === question.correctAnswer;
          let style = "border-border text-foreground bg-background hover:border-primary/40";
          if (showResult && isAnswer) style = "border-border bg-card text-[var(--sage-ink)]";
          else if (showResult && isSelected && !isAnswer) style = "border-border bg-card text-[var(--rose-ink)]";
          else if (isSelected) style = "border-primary bg-primary/10 text-primary";

          return (
            <button
              key={choice.label}
              onClick={() => !showResult && onSelect(choice.label)}
              disabled={showResult}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border text-sm transition-colors ${style}`}
            >
              <span className="font-bold shrink-0 mt-0.5">{choice.label}.</span>
              <span>{choice.text}</span>
            </button>
          );
        })}
      </div>
      {showResult && (
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          {showExplanation ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {showExplanation ? "Hide" : "Show"} Explanation
        </button>
      )}
      {showResult && showExplanation && (
        <div className="mt-3 bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
          {question.explanation}
        </div>
      )}
    </div>
  );
}
