import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ReadingLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateFleschScore(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const syllables = countSyllables(text);
  const score =
    206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  return words.reduce((total, word) => {
    let count = word.match(/[aeiouy]+/g)?.length || 1;
    if (word.endsWith("e") && count > 1) count--;
    return total + Math.max(1, count);
  }, 0);
}

export function fleschToLevel(score: number): ReadingLevel {
  if (score >= 80) return "elementary";
  if (score >= 70) return "middle";
  if (score >= 60) return "high-school";
  if (score >= 50) return "college";
  if (score >= 30) return "graduate";
  return "professional";
}

export function levelLabel(level: ReadingLevel): string {
  const labels: Record<ReadingLevel, string> = {
    elementary: "Elementary",
    middle: "Middle School",
    "high-school": "High School",
    college: "College",
    graduate: "Graduate",
    professional: "Professional",
  };
  return labels[level];
}

/**
 * Reading level is an ordered scale, so it ramps along one axis — sage (easiest)
 * through sand to rose (hardest) — instead of six unrelated hues. Six competing
 * colours read as decoration; a ramp reads as data.
 */
export function levelColor(level: ReadingLevel): string {
  const colors: Record<ReadingLevel, string> = {
    elementary: "text-[var(--sage-ink)]",
    middle: "text-[var(--sage-ink)]",
    "high-school": "text-[var(--sand-ink)]",
    college: "text-[var(--sand-ink)]",
    graduate: "text-[var(--rose-ink)]",
    professional: "text-[var(--rose-ink)]",
  };
  return colors[level];
}

/** Same ramp as levelColor: a pale wash of the accent, with ink text on top. */
export function levelBadgeColor(level: ReadingLevel): string {
  const colors: Record<ReadingLevel, string> = {
    elementary: "bg-[color-mix(in_oklab,var(--sage)_38%,transparent)] text-foreground",
    middle: "bg-[color-mix(in_oklab,var(--sage)_38%,transparent)] text-foreground",
    "high-school": "bg-[color-mix(in_oklab,var(--sand)_45%,transparent)] text-foreground",
    college: "bg-[color-mix(in_oklab,var(--sand)_45%,transparent)] text-foreground",
    graduate: "bg-[color-mix(in_oklab,var(--rose)_34%,transparent)] text-foreground",
    professional: "bg-[color-mix(in_oklab,var(--rose)_34%,transparent)] text-foreground",
  };
  return colors[level];
}

export function estimateReadTime(wordCount: number, wpm = 250): number {
  return Math.ceil(wordCount / wpm);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : (plural ?? singular + "s")}`;
}
