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
        color: "bg-orange-100 text-orange-800 border-orange-300",
      });
    }
  }

  for (const word of CONCLUSION_WORDS) {
    if (lower.includes(word)) {
      cues.push({
        type: "conclusion",
        word,
        description: "Conclusion word — marks an important inference or result",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      });
    }
  }

  for (const word of EMPHASIS_WORDS) {
    if (lower.includes(word)) {
      cues.push({
        type: "emphasis",
        word,
        description: "Emphasis word — this sentence carries a key idea",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      });
    }
  }

  for (const word of ADDITION_WORDS) {
    if (lower.includes(word)) {
      cues.push({
        type: "addition",
        word,
        description: "Addition language — extends the previous key sentence",
        color: "bg-green-100 text-green-800 border-green-300",
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
        color: "bg-purple-100 text-purple-800 border-purple-300",
      });
    }
  }

  if (sentence.trim().endsWith("?")) {
    cues.push({
      type: "question",
      word: "?",
      description: "Author's question — frames an issue the passage will answer",
      color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    });
  }

  if (sentence.includes(":") || sentence.includes(";")) {
    cues.push({
      type: "colon",
      word: sentence.includes(":") ? ":" : ";",
      description: "Colon/Semicolon — followed by explanation or example",
      color: "bg-teal-100 text-teal-800 border-teal-300",
    });
  }

  if (/"[^"]{3,}"/.test(sentence) || /“[^”]{3,}”/.test(sentence)) {
    cues.push({
      type: "quotation",
      word: '"..."',
      description: "Quotation marks — ironic usage or key point being emphasized",
      color: "bg-rose-100 text-rose-800 border-rose-300",
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
