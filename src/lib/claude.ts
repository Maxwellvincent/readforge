import Anthropic from "@anthropic-ai/sdk";
import type { CARSQuestion, PassageAnalysis, EssayType } from "@/types";
import { detectRhetoricalCues, isKeySentence } from "./cambridge/rhetorical-cues";
import { splitIntoParagraphs, splitIntoSentences, getTopicSentence, getConclusionSentence } from "./cambridge/key-clause";
import { calculateFleschScore, fleschToLevel } from "./utils";

// The SDK reads ANTHROPIC_BASE_URL from env on its own, so pointing this at an
// Anthropic-wire-compatible endpoint (e.g. https://api.moonshot.ai/anthropic) is
// purely an env change — ANTHROPIC_BASE_URL + ANTHROPIC_MODEL, no code edit.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function analyzePassage(text: string): Promise<PassageAnalysis> {
  const paragraphs = splitIntoParagraphs(text);
  const sentences = splitIntoSentences(text);

  const prompt = `You are an expert MCAT CARS instructor trained in the Cambridge Learning Center methodology.

Analyze this passage and respond in valid JSON only:

PASSAGE:
${text.slice(0, 4000)}

Return this exact JSON shape:
{
  "essayType": "expository" | "persuasive" | "narrative" | "descriptive",
  "mainIdea": "<one sentence — the central argument or thesis>",
  "thesisParagraph": "<first paragraph of the passage verbatim>",
  "keyParagraphIdeas": [
    { "index": 0, "keyIdea": "<what this paragraph contributes to the main idea>" }
  ]
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: "You are an expert MCAT CARS instructor. Respond only with valid JSON.",
    messages: [{ role: "user", content: prompt }],
  });

  let parsed: { essayType: EssayType; mainIdea: string; thesisParagraph: string; keyParagraphIdeas: { index: number; keyIdea: string }[] };
  try {
    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? "{}");
  } catch {
    parsed = { essayType: "expository", mainIdea: "", thesisParagraph: paragraphs[0] ?? "", keyParagraphIdeas: [] };
  }

  const fleschScore = calculateFleschScore(text);

  return {
    essayType: parsed.essayType ?? "expository",
    mainIdea: parsed.mainIdea ?? "",
    thesisParagraph: parsed.thesisParagraph ?? paragraphs[0] ?? "",
    keyParagraphs: (parsed.keyParagraphIdeas ?? []).map((p) => {
      const para = paragraphs[p.index] ?? "";
      return {
        index: p.index,
        topicSentence: getTopicSentence(para),
        conclusionSentence: getConclusionSentence(para),
        keyIdea: p.keyIdea,
      };
    }),
    rhetoricalCues: sentences.map((s, i) => ({
      sentenceIndex: i,
      cues: detectRhetoricalCues(s),
    })).filter((s) => s.cues.length > 0),
    difficulty: fleschToLevel(fleschScore),
  };
}

export async function generateCARSQuestions(
  passage: string,
  count = 6
): Promise<CARSQuestion[]> {
  const prompt = `You are an elite MCAT CARS instructor using the Cambridge Learning Center methodology.

Generate ${count} MCAT CARS-style questions for this passage. Include a mix of these types:
- main-idea (What is the central argument?)
- key-idea (What does paragraph X primarily establish?)
- inference (What can be inferred/concluded from the passage?)
- support (Which choice best supports the author's claim?)
- weaken (Which choice most weakens the argument?)
- analogy (Which situation is most analogous to X in the passage?)
- detail (According to the passage, X is described as...?)
- purpose (The author mentions X primarily in order to...?)

PASSAGE:
${passage.slice(0, 4000)}

Respond ONLY with a JSON array, no markdown:
[
  {
    "id": "q1",
    "type": "main-idea",
    "question": "...",
    "choices": [
      { "label": "A", "text": "..." },
      { "label": "B", "text": "..." },
      { "label": "C", "text": "..." },
      { "label": "D", "text": "..." }
    ],
    "correctAnswer": "A",
    "explanation": "The correct answer is A because... B is wrong because... (reference specific passage language)",
    "difficulty": "medium"
  }
]`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: "You are an expert MCAT CARS instructor. Respond only with valid JSON arrays.",
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const raw = response.content[0].type === "text" ? response.content[0].text : "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch?.[0] ?? "[]");
  } catch {
    return [];
  }
}

export async function generateComprehensionQuestions(
  passage: string,
  level: string,
  count = 5
): Promise<CARSQuestion[]> {
  const prompt = `You are an expert reading comprehension coach.

Generate ${count} comprehension questions appropriate for a "${level}" reading level student.

Include a mix of:
- literal comprehension (directly stated in passage)
- inferential (implied, requires reasoning)
- vocabulary in context
- author's purpose
- main idea

PASSAGE:
${passage.slice(0, 3000)}

Respond ONLY with a JSON array:
[
  {
    "id": "q1",
    "type": "detail",
    "question": "...",
    "choices": [
      { "label": "A", "text": "..." },
      { "label": "B", "text": "..." },
      { "label": "C", "text": "..." },
      { "label": "D", "text": "..." }
    ],
    "correctAnswer": "B",
    "explanation": "...",
    "difficulty": "easy"
  }
]`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: "You are an expert reading comprehension coach. Respond only with valid JSON.",
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const raw = response.content[0].type === "text" ? response.content[0].text : "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch?.[0] ?? "[]");
  } catch {
    return [];
  }
}

export { isKeySentence };
