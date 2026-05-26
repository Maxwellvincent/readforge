import type { KeyClauseAnalysis } from "@/types";
import { detectRhetoricalCues, isKeySentence } from "./rhetorical-cues";

const LINKING_VERBS = new Set([
  "is", "are", "was", "were", "be", "being", "been", "am",
  "appear", "appear", "become", "feel", "grow", "look", "remain",
  "seem", "smell", "sound", "stay", "taste", "turn",
]);

const HELPING_VERBS = new Set([
  "am", "are", "is", "was", "were", "do", "did", "have", "has", "had",
  "can", "may", "will", "could", "might", "must", "shall", "should", "would",
]);

const SUBORDINATING_CONJUNCTIONS = [
  "after", "although", "as", "because", "before", "even if", "even though",
  "if", "in order that", "once", "since", "so that", "though", "unless",
  "until", "when", "whenever", "where", "whereas", "wherever", "whether",
  "while", "why", "that", "which", "who", "whom", "whose",
];

export function analyzeKeyClause(sentence: string): KeyClauseAnalysis {
  const cues = detectRhetoricalCues(sentence);
  const keySentence = isKeySentence(sentence);
  const tokens = sentence.trim().split(/\s+/);

  // Find the main verb (simplified heuristic)
  let verbIndex = -1;
  let sentenceType: "action" | "linking" = "action";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].toLowerCase().replace(/[^a-z]/g, "");
    if (LINKING_VERBS.has(token) && verbIndex === -1) {
      verbIndex = i;
      sentenceType = "linking";
    } else if (!HELPING_VERBS.has(token) && isVerb(token) && verbIndex === -1) {
      verbIndex = i;
      sentenceType = "action";
    }
  }

  // If no verb found, treat first "is/are/was" as verb
  if (verbIndex === -1) {
    verbIndex = Math.min(3, Math.floor(tokens.length / 3));
    sentenceType = "linking";
  }

  const subject = tokens.slice(0, verbIndex).join(" ") || tokens[0];
  const verb = tokens[verbIndex] || "";
  const complement = tokens.slice(verbIndex + 1).join(" ") || "";

  // Extract important modifiers (prepositional phrases starting with common prepositions)
  const modifiers = extractModifiers(sentence);

  return {
    sentence,
    subject: subject.replace(/^(The|A|An)\s+/i, "").trim(),
    verb: verb.replace(/[^a-z]/gi, ""),
    complement: complement.trim(),
    modifiers,
    rhetoricalCues: cues,
    isKeySentence: keySentence,
    sentenceType,
  };
}

function isVerb(word: string): boolean {
  // Simple heuristic: ends in common verb suffixes or is a common verb
  const verbSuffixes = ["ed", "ing", "ize", "ise", "ate", "ify", "en"];
  const commonVerbs = [
    "say", "said", "says", "go", "goes", "went", "come", "came",
    "see", "saw", "know", "knew", "think", "thought", "get", "got",
    "make", "made", "take", "took", "give", "gave", "find", "found",
    "tell", "told", "call", "keep", "kept", "try", "tried", "hold",
    "show", "suggest", "argue", "claim", "describe", "define",
  ];
  return (
    commonVerbs.includes(word) ||
    verbSuffixes.some((s) => word.endsWith(s) && word.length > 4)
  );
}

function extractModifiers(sentence: string): string[] {
  const prepositionalPattern =
    /\b(in|on|at|by|for|with|about|against|through|during|before|after|above|below|between|among|under|over|around|without|despite|because of|due to)\s+\w+(\s+\w+)?\b/gi;
  const matches = sentence.match(prepositionalPattern) || [];
  return matches.slice(0, 4);
}

export function splitIntoSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1|SPLIT|")
    .split("|SPLIT|")
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);
}

export function getTopicSentence(paragraph: string): string {
  const sentences = splitIntoSentences(paragraph);
  return sentences[0] ?? paragraph;
}

export function getConclusionSentence(paragraph: string): string {
  const sentences = splitIntoSentences(paragraph);
  return sentences[sentences.length - 1] ?? paragraph;
}
