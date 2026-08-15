import Anthropic from "@anthropic-ai/sdk";
import type { CARSQuestion, PassageAnalysis, EssayType } from "@/types";
import { detectRhetoricalCues, isKeySentence } from "./cambridge/rhetorical-cues";
import { splitIntoParagraphs, splitIntoSentences, getTopicSentence, getConclusionSentence } from "./cambridge/key-clause";
import { calculateFleschScore, fleschToLevel } from "./utils";
import { bridgeComplete } from "./llmBridge";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-6";

/**
 * One completion, local-first.
 *
 * Tries the loopback llm-bridge (free, runs off the CLI subscriptions) and
 * falls back to the Anthropic API. On Vercel the bridge is never there, so this
 * is just the API path with a ~1.2s-capped probe in front of it — and that
 * probe result is cached, so it costs one round-trip per 30s at worst.
 */
async function complete(opts: {
  system: string;
  prompt: string;
  maxTokens: number;
}): Promise<string> {
  const viaBridge = await bridgeComplete({
    system: opts.system,
    prompt: opts.prompt,
    json: true,
  });
  if (viaBridge) return viaBridge;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "No LLM available: llm-bridge is unreachable and ANTHROPIC_API_KEY is not set."
    );
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

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

  const raw = await complete({
    system: "You are an expert MCAT CARS instructor. Respond only with valid JSON.",
    prompt,
    maxTokens: 1024,
  });

  let parsed: { essayType: EssayType; mainIdea: string; thesisParagraph: string; keyParagraphIdeas: { index: number; keyIdea: string }[] };
  try {
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

  try {
    const raw = await complete({
      system: "You are an expert MCAT CARS instructor. Respond only with valid JSON arrays.",
      prompt,
      maxTokens: 4096,
    });
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

  try {
    const raw = await complete({
      system: "You are an expert reading comprehension coach. Respond only with valid JSON.",
      prompt,
      maxTokens: 3000,
    });
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch?.[0] ?? "[]");
  } catch {
    return [];
  }
}

export { isKeySentence };
