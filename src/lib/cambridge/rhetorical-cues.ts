import type { RhetoricalCue } from "@/types";

const CONTRAST_WORDS = [
  "but", "however", "yet", "still", "though", "nevertheless", "despite",
  "in spite of", "although", "even though", "whereas", "while", "on the other hand",
  "on the contrary", "conversely", "by contrast", "rather", "instead",
];

const CONCLUSION_WORDS = [
  "consequently", "thus", "hence", "therefore", "so", "in conclusion",
  "as a result", "it follows", "accordingly", "for this reason", "thereby",
  "in sum", "ultimately", "finally", "in the end",
];

const EMPHASIS_WORDS = [
  "primarily", "above all", "essentially", "naturally", "especially",
  "most of all", "indeed", "generally", "of course", "still", "crucially",
  "importantly", "significantly", "notably", "remarkably", "fundamentally",
  "above everything", "most importantly", "in particular", "particularly",
];

const ADDITION_WORDS = [
  "in addition", "also", "additionally", "furthermore", "moreover",
  "what is more", "besides", "not only", "as well", "likewise",
];

const ENUMERATION_WORDS = [
  "first", "second", "third", "fourth", "finally", "lastly",
  "first of all", "to begin", "to start", "beginning", "middle", "end",
  "one", "two", "three", "four",
];

export function detectRhetoricalCues(sentence: string): RhetoricalCue[] {
  const lower = sentence.toLowerCase();
  const cues: RhetoricalCue[] = [];

  for (const word of CONTRAST_WORDS) {
    if (lower.includes(word)) {
      cues.push({
        type: "contrast",
        word,
        description: "Contrast signal — highlights a key opposing point",
        color: "bg-[color-mix(in_oklab,var(--rose)_30%,transparent)] text-foreground border-[var(--rose-ink)]",
      });
    }
  }

  for (const word of CONCLUSION_WORDS) {
    if (lower.includes(word)) {
      cues.push({
        type: "conclusion",
        word,
        description: "Conclusion word — marks an important inference or result",
        color: "bg-[color-mix(in_oklab,var(--sky)_28%,transparent)] text-foreground border-[var(--sky-ink)]",
      });
    }
  }

  for (const word of EMPHASIS_WORDS) {
    if (lower.includes(word)) {
      cues.push({
        type: "emphasis",
        word,
        description: "Emphasis word — this sentence carries a key idea",
        color: "bg-[color-mix(in_oklab,var(--sand)_45%,transparent)] text-foreground border-[var(--sand-ink)]",
      });
    }
  }

  for (const word of ADDITION_WORDS) {
    if (lower.includes(word)) {
      cues.push({
        type: "addition",
        word,
        description: "Addition language — extends the previous key sentence",
        color: "bg-[color-mix(in_oklab,var(--sage)_34%,transparent)] text-foreground border-[var(--sage-ink)]",
      });
    }
  }

  for (const word of ENUMERATION_WORDS) {
    const pattern = new RegExp(`\\b${word}\\b[,\\s]`, "i");
    if (pattern.test(sentence)) {
      cues.push({
        type: "enumeration",
        word,
        description: "Enumeration — part of a list of criteria or points",
        color: "bg-[color-mix(in_oklab,var(--lilac)_32%,transparent)] text-foreground border-[var(--lilac-ink)]",
      });
    }
  }

  if (sentence.trim().endsWith("?")) {
    cues.push({
      type: "question",
      word: "?",
      description: "Author's question — frames an issue the passage will answer",
      color: "bg-[color-mix(in_oklab,var(--lilac)_20%,transparent)] text-foreground border-[var(--lilac-ink)]",
    });
  }

  if (sentence.includes(":") || sentence.includes(";")) {
    cues.push({
      type: "colon",
      word: sentence.includes(":") ? ":" : ";",
      description: "Colon/Semicolon — followed by explanation or example",
      color: "bg-[color-mix(in_oklab,var(--sage)_20%,transparent)] text-foreground border-[var(--sage-ink)]",
    });
  }

  if (/"[^"]{3,}"/.test(sentence) || /“[^”]{3,}”/.test(sentence)) {
    cues.push({
      type: "quotation",
      word: '"..."',
      description: "Quotation marks — ironic usage or key point being emphasized",
      color: "bg-[color-mix(in_oklab,var(--rose)_18%,transparent)] text-foreground border-[var(--rose-ink)]",
    });
  }

  return cues;
}

export function isKeySentence(sentence: string): boolean {
  const cues = detectRhetoricalCues(sentence);
  return cues.length > 0;
}

export function highlightCuesInText(
  text: string
): { word: string; cue: RhetoricalCue | null }[] {
  return text.split(/\s+/).map((word) => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    const allCueWords = [
      ...CONTRAST_WORDS,
      ...CONCLUSION_WORDS,
      ...EMPHASIS_WORDS,
      ...ADDITION_WORDS,
    ];
    const match = allCueWords.find((cw) => cw === clean || cw.startsWith(clean));
    if (!match) return { word, cue: null };
    const cues = detectRhetoricalCues(word);
    return { word, cue: cues[0] ?? null };
  });
}

export { CONTRAST_WORDS, CONCLUSION_WORDS, EMPHASIS_WORDS, ADDITION_WORDS };
