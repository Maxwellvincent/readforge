# ReadForge Redesign — Zen Dojo (light-only)

Decided 2026-08-15. Direction locked: **Inspiration Library #08 "Zen Dojo Study
Dashboard"**. Light-only — no dark theme. Scope — every screen.

The current UI is a near-black shadcn default (`--background: oklch(0.08 0.01 264)`,
violet primary) that reads as generic and is too low-contrast to read comfortably.
This replaces the palette, the type scale, and the component chrome.

## Art direction (from `inspo brief 8` — treat as the contract)

Warm paper canvas, ink-wash restraint, data presented quietly. It should feel
like a rice-paper study desk, not a SaaS console.

**Palette**

| Token | Hex | Use |
| --- | --- | --- |
| page | `#F7F4EC` | app canvas |
| card | `#FFFDF7` | card surfaces |
| sidebar | `#EFEAE0` | left rail |
| border | `#E4DFD4` | 1px hairlines |
| ink | `#1E1E1C` | primary text, hero numerals |
| muted | `#8A8A85` | labels, secondary text |
| sage | `#A8C3A0` | data accent + nav active fill |
| sky | `#6E9EC7` | data accent (sparklines, radar) |
| rose | `#D98A8A` | data accent (negative/attention) |
| sand | `#D9C9A8` | data accent |
| lilac | `#B7B2D6` | data accent |

Accents appear **only inside data** — never as page furniture.

**Typography** — one humanist sans (Inter). Card labels 11px uppercase, 0.08em
tracking, muted. Hero numerals 48–56px / 600 / ink. Body 13–14px `#55554F`.
Greeting 20px medium + 13px muted subline. Kanji in a serif JP face at 13px.

**Spacing** — 8px base; 16px padding on small cards, 20px on large; 24px between
cards; 12px between label and value.

**Components** — cards: 10px radius, 1px hairline border, **no shadow** (max
`0 1px 2px rgba(0,0,0,.03)`). Buttons: full-width ghost, hairline border, 8px
radius. Nav items: 8px radius; active gets pale sage fill + small right chevron.
List rows: label left, chevron right, hairline divider.

**Charts** — donut, 8px stroke, centered percentage. Sparkline as a 2px sky
polyline on a faint axis. Radar sky blue at 25% fill. Streak dots as small
circles, ink-filled for hit days.

**Motion** — 150–200ms ease-out only. Cards shift border colour on hover, never
scale. Donut/sparkline draw in over 600ms on mount.

**Avoid** — drop shadows, glassmorphism, saturated or neon accents, dark-mode
inversion of this palette, icon-heavy or badge-heavy chrome.

## What the tree actually looks like right now

- `src/app/globals.css` — `:root` is the dark palette; a `.dark` block exists at
  line 86; `@custom-variant dark` at line 5. Tokens are already centralised, so
  the palette swap is one file.
- **256 hardcoded Tailwind palette utilities** (`text-indigo-400`,
  `bg-green-500/10`, …) across 13 files. The token swap alone will *not* fix the
  look — these are the actual work. Worst offenders: LibraryClient (47),
  DashboardClient (31), RSVPTrainer (26), ProfileClient (20), CARSSession (19),
  ArticleReader (17), GrammarModuleClient (16), `app/page.tsx` (15), CARSHome (12).
- Two **non-component** files map meaning → colour and must be re-mapped to the
  accent set, not spot-edited: `src/lib/cambridge/rhetorical-cues.ts` (24) and
  `src/lib/utils.ts` (18).
- Only 5 shadow/backdrop-blur usages — cheap to remove.
- `next-themes` is wired up; light-only means removing the toggle and provider
  rather than leaving a dead switch.

## Status — 2026-08-16

| Ticket | State |
| --- | --- |
| T1 tokens | done — palette, accents (+ readable `-ink` variants), 10px radius, type utilities |
| T2 kill dark mode | done — `.dark` block gone, `dark:` variant bound to a never-matching selector, `next-themes` removed |
| T3 semantic colour maps | done — `rhetorical-cues.ts` and `utils.ts` re-mapped; reading level now ramps sage->sand->rose instead of six unrelated hues |
| T4 shared chrome | partial — sidebar active state (sage fill + chevron) done; top bar with kanji pill and search NOT built |
| T5 dashboard | done — charts restyled, chips fixed, action cards converted to list rows |
| T6 library | not visually reviewed |
| T7 reader | partial — measure capped at 68ch, prose darkened, cue highlights rewritten; NOT visually verified against a real article |
| T8 other screens | inherited the token + colour remap; speed/profile/grammar spot-checked, CARS/onboarding/landing not reviewed |
| T9 sumi-e assets | not started |
| T10 sweep | hardcoded palette utilities: **0 remaining** (was 256). Build + typecheck clean. Contrast verified numerically |

Two bugs were found by running it in a browser rather than reading the code, and
both are fixed: `adminDb()` called Firestore `settings()` twice across module
instances, and the presence-only proxy caused an **infinite redirect loop** on any
stale cookie (`/dashboard` -> `/login` -> `/dashboard`). The proxy now verifies
the cookie signature with `jose` and clears bad cookies.

## Tickets

**T1 — Token layer.** Rewrite `:root` in `globals.css` to the Zen Dojo palette;
delete the `.dark` block and `@custom-variant dark`; add the five data accents as
first-class tokens (`--accent-sage`, `--accent-sky`, `--accent-rose`,
`--accent-sand`, `--accent-lilac`). Set `--radius` to 10px. Add the type scale as
utilities (`.label-caps`, `.hero-numeral`). No component edits in this ticket.
*Done when:* the app renders on warm paper with no component changes, however
wrong individual widgets still look.

**T2 — Kill dark mode.** Remove `next-themes` provider, the theme toggle, and any
`dark:` variants. Set `color-scheme: light`.
*Done when:* no dark path remains and no dead toggle ships.

**T3 — Semantic colour maps.** Re-map `rhetorical-cues.ts` and `utils.ts` from raw
Tailwind classes to the accent tokens, keeping the *meaning* distinctions
(contrast / conclusion / emphasis…) legible on paper. These two files feed the
reader overlay, so they gate T7.

**T4 — Shared chrome.** Sidebar (240px, `#EFEAE0`, logo lockup, vertical nav with
sage active fill + chevron, user chip pinned bottom) and the top bar (greeting
left, kanji quote pill centre, search with ⌘K hint, bell, avatar). Update
`components/ui/*` primitives — card, button, badge, input, tabs, progress — to
hairline-and-no-shadow.
*Done when:* chrome matches the brief on every screen at once.

**T5 — Dashboard.** 12-column grid, 24px gutters. Row one: 4 cards (3/12, 3/12,
2/12, 4/12). Row two: 5 smaller cards. Recharts restyled — donut 8px stroke,
sparkline 2px sky, radar 25% sky fill, streak dots. Hero numerals 48–56px.

**T6 — Library.** Card grid on paper, hairline borders, pill filter chips, tab row
restyled. Biggest single file (47 hardcoded colours).

**T7 — Reader.** `/library/[id]` and RSVPModal. Long-form reading column: measure
~68ch, body 16–17px, generous leading. Cambridge overlay uses T3's accents at low
opacity so highlighting never fights the prose. This is the screen that matters
most for the "can't process it" complaint.

**T8 — Speed, Grammar, CARS, Profile, Onboarding, landing page.** Same treatment,
no new patterns.

**T9 — Sumi-e assets.** Generate via Higgsfield, per `inspo recipe 8`. Monochrome
ink illustrations bleeding out of card corners at 25–40% opacity — mountains,
bamboo sprig, torii gate, lone samurai. Plus a 3% paper-grain overlay.
Ready-made prompt:
> Soft sumi-e ink-wash illustration rendered on warm off-white paper, delicate
> dry-brush strokes and washed grey gradients fading to nothing at the edges,
> generous negative space, centered low-contrast composition with a faint
> mountain or torii silhouette on the horizon, flat even daylight with no cast
> shadows, strict palette of paper cream #F7F4EC, warm ivory #FFFDF7, ink
> charcoal #2B2B2B, mist grey #B9BCC0, sage #A8C3A0, sky blue #6E9EC7, dusty rose
> #D98A8A, subtle paper grain texture, no browns, no gradients in the background,
> no photographic realism, no heavy black fills.

**T10 — Sweep and verify.** `grep` for remaining hardcoded palette utilities and
shadow classes; expect zero. Contrast-check body and muted text against `#F7F4EC`
for WCAG AA. `npm run build` + lint clean. Update README (living-doc rule) with
the new design language in the same commit.

## Order

T1 → T2 → T3 → T4 → then T5/T6/T7 in parallel → T8 → T9 → T10.
T4 gates the screen tickets; T3 gates T7.

## Notes

- `muted` `#8A8A85` on `#F7F4EC` is roughly 3.4:1 — fine for 11px uppercase
  labels, **not** for body copy. Body stays `#55554F`. Do not let muted creep
  into paragraphs; that is exactly the failure mode being fixed.
- Reading surfaces (T7) carry the complaint. If time runs short, they land first.
