-- HISTORICAL REFERENCE ONLY — NOT THE LIVE SCHEMA.
--
-- ReadForge migrated from Supabase/Postgres to Firebase Auth + Firestore on
-- 2026-08-14. This file is the last Supabase migration and is kept only to
-- document what the Postgres schema looked like. It was already stale when the
-- migration happened: the live database also had `bookmarks`, `user_documents`,
-- and `profiles.interests / readwise_token / goodreads_user_id`, none of which
-- appear below.
--
-- The live data model is documented in README.md and enforced by firestore.rules.

-- ReadForge Database Schema

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  baseline_wpm integer default 200,
  current_wpm integer default 200,
  reading_level text default 'college',
  streak_days integer default 0,
  last_active date,
  total_words_read bigint default 0,
  articles_read integer default 0,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- Articles (cached RSS articles)
create table if not exists public.articles (
  id text primary key,
  title text not null,
  source text not null,
  source_url text,
  content text,
  excerpt text,
  author text,
  published_at timestamptz,
  topics text[],
  reading_level text,
  flesch_score integer,
  estimated_minutes integer,
  word_count integer,
  essay_type text,
  image_url text,
  cached_at timestamptz default now()
);

-- WPM Tests
create table if not exists public.wpm_tests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  wpm integer not null,
  comprehension_score integer, -- 0-100
  article_id text references public.articles,
  mode text default 'normal', -- 'rsvp', 'normal', 'focus'
  tested_at timestamptz default now()
);

-- Reading Sessions (article reads)
create table if not exists public.reading_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  article_id text references public.articles,
  started_at timestamptz default now(),
  completed_at timestamptz,
  time_spent_seconds integer,
  words_read integer,
  mode text default 'analytical', -- 'analytical', 'impressionistic', 'speed'
  cambridge_mode_on boolean default false
);

-- Comprehension Quiz Responses
create table if not exists public.quiz_responses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  article_id text,
  cars_session_id uuid,
  question_type text,
  question_text text,
  user_answer text,
  correct_answer text,
  is_correct boolean,
  responded_at timestamptz default now()
);

-- Grammar Module Progress
create table if not exists public.grammar_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  module_id text not null,
  lesson_id text not null,
  completed boolean default false,
  score integer, -- drill score 0-100
  attempts integer default 0,
  completed_at timestamptz,
  unique(user_id, module_id, lesson_id)
);

-- CARS Sessions
create table if not exists public.cars_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  mode text default 'practice', -- 'practice', 'timed', 'diagnostic'
  time_limit_seconds integer default 5400, -- 90 min default
  started_at timestamptz default now(),
  completed_at timestamptz,
  total_questions integer,
  correct_answers integer,
  score_percent integer,
  passages_data jsonb -- stores passages + questions + answers
);

-- Skill Scores (aggregate per question type)
create table if not exists public.skill_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  question_type text not null, -- 'main-idea', 'inference', etc.
  correct integer default 0,
  total integer default 0,
  last_updated timestamptz default now(),
  unique(user_id, question_type)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.wpm_tests enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.quiz_responses enable row level security;
alter table public.grammar_progress enable row level security;
alter table public.cars_sessions enable row level security;
alter table public.skill_scores enable row level security;
alter table public.articles enable row level security;

-- RLS Policies
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users view own wpm" on public.wpm_tests for all using (auth.uid() = user_id);
create policy "Users view own sessions" on public.reading_sessions for all using (auth.uid() = user_id);
create policy "Users view own quiz" on public.quiz_responses for all using (auth.uid() = user_id);
create policy "Users view own grammar" on public.grammar_progress for all using (auth.uid() = user_id);
create policy "Users view own cars" on public.cars_sessions for all using (auth.uid() = user_id);
create policy "Users view own skills" on public.skill_scores for all using (auth.uid() = user_id);
create policy "Anyone reads articles" on public.articles for select using (true);
create policy "Service inserts articles" on public.articles for insert with check (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
