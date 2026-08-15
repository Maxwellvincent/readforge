/**
 * Firestore-facing shapes.
 *
 * User-owned documents use camelCase and carry ISO-8601 strings once they cross
 * into React — Firestore `Timestamp` objects are not serializable across the
 * RSC boundary, so every repository converts before returning.
 *
 * The `Article` domain type in `src/types/index.ts` deliberately keeps its
 * snake_case shape: it is a feed/wire type shared with the reader UI and the
 * RSS layer, not a Supabase artifact, so renaming it would churn the whole
 * reader for no gain.
 */

export interface Profile {
  uid: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  baselineWpm: number;
  currentWpm: number;
  readingLevel: string;
  streakDays: number;
  lastActive: string | null;
  totalWordsRead: number;
  articlesRead: number;
  onboardingComplete: boolean;
  interests: string[];
  goodreadsUserId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WpmTest {
  id: string;
  wpm: number;
  comprehensionScore: number | null;
  articleId: string | null;
  mode: "normal" | "rsvp" | "focus";
  testedAt: string;
}

export interface ReadingSession {
  id: string;
  articleId: string | null;
  startedAt: string;
  completedAt: string | null;
  timeSpentSeconds: number | null;
  wordsRead: number | null;
  mode: string;
  cambridgeModeOn: boolean;
}

export interface CarsSession {
  id: string;
  mode: string;
  timeLimitSeconds: number;
  startedAt: string;
  completedAt: string | null;
  totalQuestions: number | null;
  correctAnswers: number | null;
  scorePercent: number | null;
}

export interface GrammarProgress {
  id: string;
  moduleId: string;
  lessonId: string;
  completed: boolean;
  score: number | null;
  attempts: number;
  completedAt: string | null;
}

export interface Bookmark {
  articleId: string;
  articleData: Record<string, unknown>;
  savedAt: string;
}

export interface UserDocument {
  id: string;
  title: string;
  author: string | null;
  content: string;
  wordCount: number;
  fileType: string;
  readingLevel: string | null;
  fleschScore: number | null;
  uploadedAt: string;
}

export const DEFAULT_PROFILE = {
  baselineWpm: 200,
  currentWpm: 200,
  readingLevel: "college",
  streakDays: 0,
  lastActive: null,
  totalWordsRead: 0,
  articlesRead: 0,
  onboardingComplete: false,
  interests: [] as string[],
  goodreadsUserId: null,
} as const;
