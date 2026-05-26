export type ReadingLevel =
  | "elementary"
  | "middle"
  | "high-school"
  | "college"
  | "graduate"
  | "professional";

export type EssayType =
  | "expository"
  | "persuasive"
  | "narrative"
  | "descriptive"
  | "unknown";

export type QuestionType =
  | "main-idea"
  | "key-idea"
  | "support"
  | "weaken"
  | "inference"
  | "analogy"
  | "detail"
  | "purpose";

export interface Article {
  id: string;
  title: string;
  source: string;
  source_url: string;
  content: string;
  excerpt: string;
  author?: string;
  published_at: string;
  topic: string[];
  reading_level: ReadingLevel;
  flesch_score: number;
  estimated_wpm: number;
  word_count: number;
  essay_type: EssayType;
  image_url?: string;
  cached_at: string;
}

export interface RhetoricalCue {
  type:
    | "contrast"
    | "conclusion"
    | "emphasis"
    | "enumeration"
    | "addition"
    | "question"
    | "colon"
    | "italics"
    | "quotation";
  word: string;
  description: string;
  color: string;
}

export interface KeyClauseAnalysis {
  sentence: string;
  subject: string;
  verb: string;
  complement: string;
  modifiers: string[];
  rhetoricalCues: RhetoricalCue[];
  isKeySentence: boolean;
  sentenceType: "action" | "linking";
}

export interface PassageAnalysis {
  essayType: EssayType;
  mainIdea: string;
  thesisParagraph: string;
  keyParagraphs: {
    index: number;
    topicSentence: string;
    conclusionSentence: string;
    keyIdea: string;
  }[];
  rhetoricalCues: { sentenceIndex: number; cues: RhetoricalCue[] }[];
  difficulty: ReadingLevel;
}

export interface CARSQuestion {
  id: string;
  type: QuestionType;
  question: string;
  choices: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface CARSSession {
  id: string;
  user_id: string;
  passages: CARSPassage[];
  time_limit_seconds: number;
  time_started?: string;
  time_completed?: string;
  score?: number;
  total_questions: number;
  correct_answers: number;
}

export interface CARSPassage {
  id: string;
  text: string;
  source?: string;
  questions: CARSQuestion[];
  userAnswers: Record<string, string>;
}

export interface WPMTest {
  id: string;
  user_id: string;
  wpm: number;
  comprehension_score: number;
  article_id?: string;
  tested_at: string;
  mode: "rsvp" | "normal" | "focus";
}

export interface GrammarModule {
  id: string;
  number: number;
  title: string;
  description: string;
  lessons: GrammarLesson[];
  cambridge_reference: string;
}

export interface GrammarLesson {
  id: string;
  title: string;
  concept: string;
  explanation: string;
  examples: { sentence: string; analysis: string }[];
  drill: GrammarDrill[];
}

export interface GrammarDrill {
  id: string;
  type:
    | "identify-subject"
    | "identify-verb"
    | "classify-noun"
    | "find-key-clause"
    | "spot-rhetorical-cue"
    | "label-parts";
  sentence: string;
  question: string;
  choices?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface UserProgress {
  user_id: string;
  current_wpm: number;
  baseline_wpm: number;
  avg_comprehension: number;
  reading_level: ReadingLevel;
  grammar_modules_completed: string[];
  cars_sessions_completed: number;
  cars_avg_score: number;
  articles_read: number;
  total_words_read: number;
  streak_days: number;
  last_active: string;
  skill_scores: {
    main_idea: number;
    key_idea: number;
    inference: number;
    detail: number;
    tone: number;
    rhetoric: number;
  };
}

export interface RSSFeed {
  name: string;
  url: string;
  category: "humanities" | "science" | "social-science" | "fiction" | "mcat";
  defaultTopics: string[];
}
