"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Zap } from "lucide-react";

interface Props {
  text: string;
  title: string;
  defaultWpm?: number;
  onClose: () => void;
}

const PIVOT_RATIOS: Record<number, number> = {
  1: 0, 2: 0, 3: 0.3, 4: 0.3, 5: 0.3, 6: 0.35, 7: 0.35, 8: 0.4, 9: 0.4,
};

function getPivot(word: string): number {
  const len = word.length;
  if (len <= 2) return 0;
  return Math.round(len * (PIVOT_RATIOS[Math.min(len, 9)] ?? 0.4));
}

export function RSVPModal({ text, title, defaultWpm = 250, onClose }: Props) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const [wpm, setWpm] = useState(Math.round(defaultWpm / 25) * 25);
  const [wordIndex, setWordIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const msPerWord = Math.round((60 / wpm) * 1000);
  const currentWord = words[wordIndex] ?? "";
  const pivot = getPivot(currentWord);
  const progress = words.length > 0 ? (wordIndex / words.length) * 100 : 0;

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    if (finished) { setWordIndex(0); setFinished(false); }
    setPlaying(true);
  }, [finished]);

  function reset() {
    stop();
    setWordIndex(0);
    setFinished(false);
  }

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setWordIndex((prev) => {
          if (prev >= words.length - 1) {
            stop();
            setFinished(true);
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

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { stop(); onClose(); }
      if (e.key === " ") { e.preventDefault(); playing ? stop() : start(); }
      if (e.key === "ArrowLeft") setWordIndex((p) => Math.max(0, p - 10));
      if (e.key === "ArrowRight") setWordIndex((p) => Math.min(words.length - 1, p + 10));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, stop, start, words.length]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Zap className="w-4 h-4 text-[var(--sand-ink)] shrink-0" />
          <span className="font-bold text-[var(--sand-ink)] shrink-0">{wpm} WPM</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground truncate">{title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">Space = play/pause · ← → skip</span>
          <button
            onClick={() => { stop(); onClose(); }}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* WPM slider strip */}
      <div className="px-8 py-3 border-b border-border/50 bg-card/50 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <span className="text-xs text-muted-foreground w-8">100</span>
          <input
            type="range"
            min={100}
            max={800}
            step={25}
            value={wpm}
            onChange={(e) => { setWpm(Number(e.target.value)); reset(); }}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground w-8">800</span>
          {/* Quick presets */}
          <div className="flex gap-1 ml-2">
            {[150, 250, 350, 450].map((v) => (
              <button
                key={v}
                onClick={() => { setWpm(v); reset(); }}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  wpm === v ? "bg-[color-mix(in_oklab,var(--sage)_28%,transparent)] border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RSVP word display */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Progress bar */}
        <div className="w-full max-w-2xl bg-muted rounded-full h-1 mb-12">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Word */}
        <div className="rsvp-display flex items-baseline mb-4" style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}>
          <span className="text-muted-foreground">
            {currentWord.slice(0, pivot)}
          </span>
          <span className="rsvp-pivot" style={{ fontSize: "inherit" }}>
            {currentWord[pivot] ?? ""}
          </span>
          <span className="text-muted-foreground">
            {currentWord.slice(pivot + 1)}
          </span>
        </div>

        {/* Position */}
        <p className="text-sm text-muted-foreground mb-12">
          {wordIndex + 1} / {words.length}
          {finished && <span className="ml-3 text-[var(--sage-ink)] font-medium">· Complete!</span>}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setWordIndex((p) => Math.max(0, p - 10))}
            disabled={wordIndex === 0}
            className="p-3 rounded-xl border border-border text-muted-foreground hover:border-primary/40 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={playing ? stop : start}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-10 py-3.5 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors"
          >
            {playing ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" />{wordIndex > 0 && !finished ? "Resume" : "Start"}</>}
          </button>

          <button
            onClick={reset}
            className="p-3 rounded-xl border border-border text-muted-foreground hover:border-primary/40 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setWordIndex((p) => Math.min(words.length - 1, p + 10))}
            disabled={wordIndex >= words.length - 1}
            className="p-3 rounded-xl border border-border text-muted-foreground hover:border-primary/40 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="mt-12 flex gap-8 text-xs text-muted-foreground">
          <span>~{Math.round(words.length / wpm)} min at {wpm} WPM</span>
          <span>{Math.round(progress)}% complete</span>
          <span>{words.length.toLocaleString()} words</span>
        </div>
      </div>
    </div>
  );
}
