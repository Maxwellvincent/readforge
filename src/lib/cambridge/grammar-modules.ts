import type { GrammarModule } from "@/types";

export const GRAMMAR_MODULES: GrammarModule[] = [
  {
    id: "module-1",
    number: 1,
    title: "Parts of Speech",
    description: "Master the 8 parts of speech. The foundation of every sentence.",
    cambridge_reference: "Cambridge Learning Center — Module 1",
    lessons: [
      {
        id: "m1-nouns",
        title: "Nouns",
        concept: "Nouns are the names of persons, places, things, or ideas.",
        explanation: `**Test:** Is it the name of a person, place, thing, or idea?

**Categories:**
- **Proper Nouns** = specific persons/places (capitalized): *Napoleon, New York*
- **Common Nouns** = generic, not specific: *man, city*
- **Concrete Nouns** = perceived by the senses: *bread, odor*
- **Abstract Nouns** = cannot be sensed: *history, love, prosperity*
- **Collective Nouns** = group as a unit: *team, jury, family*
- **Compound Nouns** = two or more words: *New York, haircut*

**Note:** Any noun can belong to multiple categories. *American History* = abstract AND proper.`,
        examples: [
          { sentence: "The jury delivered its verdict after deliberation.", analysis: "'jury' = common, collective, concrete noun. 'deliberation' = common, abstract noun." },
          { sentence: "Napoleon's ambition reshaped European history.", analysis: "'Napoleon' = proper, concrete. 'ambition' = common, abstract. 'history' = common, abstract." },
        ],
        drill: [
          { id: "m1-d1", type: "classify-noun", sentence: "The team celebrated their victory with joy.", question: "What type of noun is 'joy'?", choices: ["Common, Abstract", "Common, Concrete", "Proper, Abstract", "Collective"], correctAnswer: "Common, Abstract", explanation: "'Joy' is common (not a specific proper name) and abstract (cannot be perceived by the senses)." },
          { id: "m1-d2", type: "classify-noun", sentence: "Mount Everest towers above all other mountains.", question: "What type of noun is 'Mount Everest'?", choices: ["Proper, Concrete", "Common, Concrete", "Proper, Abstract", "Collective"], correctAnswer: "Proper, Concrete", explanation: "'Mount Everest' is proper (capitalized, specific) and concrete (you can see and touch it)." },
          { id: "m1-d3", type: "identify-subject", sentence: "Courage defines a hero.", question: "What part of speech is 'Courage' in this sentence?", choices: ["Abstract Noun", "Adjective", "Verb", "Adverb"], correctAnswer: "Abstract Noun", explanation: "'Courage' is an abstract noun — it cannot be perceived by the senses. It is the subject of this sentence." },
        ],
      },
      {
        id: "m1-verbs",
        title: "Action & Linking Verbs",
        concept: "Verbs either show action (action verbs) or state of being/condition (linking verbs).",
        explanation: `**Action Verbs** = show physical or mental action: *run, think, argue, define*

**Linking Verbs** = connect subject to description; no action:
- *is, are, was, were, be, being, been, am*
- *appear, become, feel, grow, look, remain, seem, smell, sound, taste*

**Test:** Can you substitute "is/are/was" without changing the essential meaning? If yes, it's linking.

**Verb Phrases** = verbs made of multiple words
- Main Verb = the **last** word: *He **will have gone***
- Helping Verbs = all others: *will, have, should, could, might, must...*

**Critical distinction:** A linking verb acting as a helping verb loses its linking quality.
- Linking: *I **am** a doctor.* (connects "I" to "doctor")
- Helping: *I **am going** home.* ("going" is the main verb)`,
        examples: [
          { sentence: "The argument seems persuasive but lacks evidence.", analysis: "'seems' = linking verb (connects 'argument' to 'persuasive'). 'lacks' = action verb." },
          { sentence: "She should have been more careful in her analysis.", analysis: "Verb phrase: 'should have been.' Main verb = 'been.' Helping verbs = 'should,' 'have.'" },
        ],
        drill: [
          { id: "m1-d4", type: "identify-verb", sentence: "The philosopher appears certain of her conclusion.", question: "Is 'appears' an action verb or a linking verb?", choices: ["Linking Verb", "Action Verb", "Helping Verb", "Verbal"], correctAnswer: "Linking Verb", explanation: "'Appears' here means 'seems' — it connects the subject 'philosopher' to the description 'certain.' You can substitute 'is' without losing meaning." },
          { id: "m1-d5", type: "identify-verb", sentence: "The evidence strongly suggests a causal relationship.", question: "What is the simple predicate (main verb) of this sentence?", choices: ["suggests", "strongly", "evidence", "relationship"], correctAnswer: "suggests", explanation: "'Suggests' is the action verb — the simple predicate. 'Strongly' is an adverb modifying it." },
        ],
      },
    ],
  },
  {
    id: "module-2",
    number: 2,
    title: "Parts of a Sentence",
    description: "Every sentence has a subject and predicate. Learn to find both instantly.",
    cambridge_reference: "Cambridge Learning Center — Module 2",
    lessons: [
      {
        id: "m2-subject-predicate",
        title: "Subject & Predicate",
        concept: "Subject = what the sentence is about. Predicate = what the sentence says about it.",
        explanation: `**Every sentence has:**
- **Subject** = What (or who) the sentence is about
- **Predicate** = What the sentence says about the subject

**Simple Subject** = Stripped-down noun/pronoun (no modifiers)
**Simple Predicate** = The main verb

**Example:** *That young man is a good student.*
- Full subject: "That young man"
- **Simple subject: "man"**
- Full predicate: "is a good student"
- **Simple predicate (verb): "is"**

**Why this matters for CARS:** When you strip a complex sentence down to its simple subject and simple predicate, you immediately see what the sentence is actually claiming. This is the Key Clause.`,
        examples: [
          { sentence: "The long, complicated argument about economic policy ultimately failed.", analysis: "Simple Subject: 'argument'. Simple Predicate: 'failed'. The modifiers ('long, complicated,' 'about economic policy,' 'ultimately') are secondary." },
          { sentence: "Neither the evidence nor the testimony supports this interpretation.", analysis: "Compound Simple Subject: 'evidence' + 'testimony'. Simple Predicate: 'supports'." },
        ],
        drill: [
          { id: "m2-d1", type: "identify-subject", sentence: "The complex web of political alliances between the major powers ultimately precipitated the conflict.", question: "What is the SIMPLE subject of this sentence?", choices: ["web", "alliances", "powers", "conflict"], correctAnswer: "web", explanation: "'Web' is the simple subject — the core noun stripped of all modifiers. 'Complex,' 'of political alliances,' and 'between the major powers' are all modifiers of 'web.'" },
          { id: "m2-d2", type: "identify-verb", sentence: "Not all theories of consciousness adequately explain the subjective quality of experience.", question: "What is the simple predicate?", choices: ["explain", "adequately", "theories", "quality"], correctAnswer: "explain", explanation: "'Explain' is the main action verb — the simple predicate. 'Adequately' is an adverb modifying it." },
        ],
      },
      {
        id: "m2-complements",
        title: "Complements: Direct & Indirect Objects",
        concept: "Complements complete the meaning of subject + verb. Types: Direct Object, Indirect Object, Predicate Nominative, Predicate Adjective.",
        explanation: `**For Action Verbs:**

**Step 1:** Find the verb (action or linking?)
**Step 2:** Subject = "Who or What" + verb?
**Step 3:** Objects = Subject + Verb + "Who or What"?

**Direct Object** = receives the action; no "to" or "for"
**Indirect Object** = always animate (usually a person); has "to" or "for" (explicit or implied)

*The boy gives roses to the girl.*
- Subject: boy | Verb: gives | **Direct Object: roses** | **Indirect Object: girl** (to)

**For Linking Verbs:**
**Predicate Nominative** = noun that follows; renames the subject
**Predicate Adjective** = adjective that follows; describes the subject

*She is an athlete.* → "athlete" = **Predicate Nominative** (noun renaming "She")
*She is intelligent.* → "intelligent" = **Predicate Adjective** (adjective describing "She")`,
        examples: [
          { sentence: "The author gave readers a powerful argument for reform.", analysis: "Verb: gave. Subject: author. Direct Object: argument ('what was given'). Indirect Object: readers ('to whom it was given')." },
          { sentence: "This theory remains controversial among scientists.", analysis: "Linking verb: 'remains'. Subject: 'theory'. Predicate Adjective: 'controversial' (describes the theory)." },
        ],
        drill: [
          { id: "m2-d3", type: "identify-subject", sentence: "The committee awarded the researcher a prestigious grant.", question: "What is the INDIRECT OBJECT?", choices: ["researcher", "committee", "grant", "prestigious"], correctAnswer: "researcher", explanation: "'Researcher' is the indirect object — the person TO WHOM the grant was awarded. 'Grant' is the direct object (the thing given)." },
          { id: "m2-d4", type: "find-key-clause", sentence: "His argument appears sound but contains a subtle logical fallacy.", question: "What is 'sound' in this sentence?", choices: ["Predicate Adjective", "Direct Object", "Predicate Nominative", "Adverb"], correctAnswer: "Predicate Adjective", explanation: "'Appears' is a linking verb. 'Sound' is an adjective that follows, describing the subject 'argument.' Therefore it is a Predicate Adjective." },
        ],
      },
    ],
  },
  {
    id: "module-3",
    number: 3,
    title: "Clauses",
    description: "Independent vs. Dependent. Relative pronouns. Subordinating conjunctions. The architecture of complex sentences.",
    cambridge_reference: "Cambridge Learning Center — Module 3",
    lessons: [
      {
        id: "m3-clauses",
        title: "Independent & Dependent Clauses",
        concept: "A clause has a subject and a verb. Independent clauses stand alone. Dependent clauses cannot.",
        explanation: `**Clause** = group of related words with a subject AND a verb (but not necessarily a complete sentence)

**Independent (Main) Clause** = can stand alone as a complete sentence
- *He went home.* ✓ (complete thought)

**Dependent (Subordinate) Clause** = cannot stand alone; leaves you waiting
- *After he went home,* ✗ (then what?)

**Signals of a Subordinate Clause:**
- **Relative Pronouns:** who, whom, that, which, whose
  - *The man **who came from Boston** went to New York.*
- **Subordinating Conjunctions:** after, although, because, before, if, since, though, unless, until, when, where, while, that, which
  - *I went because **he invited me.*** (tells WHY)

**3 types of subordinate clauses:**
- **Noun Clause** = subject, direct object, or object of preposition
- **Adjective Clause** = modifies a noun or pronoun
- **Adverb Clause** = modifies a verb (tells how/when/where/why)`,
        examples: [
          { sentence: "The philosopher who challenged empiricism most effectively was David Hume.", analysis: "'who challenged empiricism most effectively' = adjective clause modifying 'philosopher.' 'The philosopher...was David Hume' = independent clause." },
          { sentence: "Although the evidence seemed compelling, the jury remained skeptical.", analysis: "'Although the evidence seemed compelling' = dependent adverb clause (tells 'under what condition'). 'The jury remained skeptical' = independent clause." },
        ],
        drill: [
          { id: "m3-d1", type: "find-key-clause", sentence: "The discovery that matter is composed of atoms revolutionized chemistry.", question: "What type of clause is 'that matter is composed of atoms'?", choices: ["Noun Clause (Adjective)", "Adjective Clause", "Adverb Clause", "Independent Clause"], correctAnswer: "Noun Clause (Adjective)", explanation: "'that matter is composed of atoms' is a noun clause acting as an adjective — it specifies which discovery. It is introduced by the relative pronoun 'that' and modifies the noun 'discovery.'" },
          { id: "m3-d2", type: "spot-rhetorical-cue", sentence: "Because the argument fails to account for counterexamples, we must reject its conclusion.", question: "What is the function of the 'Because' clause?", choices: ["Adverb clause telling WHY", "Adjective clause modifying 'argument'", "Independent clause", "Noun clause as subject"], correctAnswer: "Adverb clause telling WHY", explanation: "'Because the argument fails to account for counterexamples' is an adverb clause. It modifies 'must reject' by explaining the reason (WHY we must reject). 'Because' = subordinating conjunction." },
        ],
      },
    ],
  },
  {
    id: "module-4",
    number: 4,
    title: "Phrases",
    description: "Prepositional phrases, verbals (gerunds, participles, infinitives), and verbal phrases.",
    cambridge_reference: "Cambridge Learning Center — Module 4",
    lessons: [
      {
        id: "m4-phrases",
        title: "Prepositional Phrases & Verbals",
        concept: "Phrases have no subject-verb pair. They function as modifiers.",
        explanation: `**Phrase** = group of related words WITHOUT a subject-verb pair

**Prepositional Phrase** = preposition + object (noun/pronoun)
- Always acts as a modifier (adjective or adverb)
- *The man **from Boston** went **to New York.***
  - "from Boston" describes the man (adjective)
  - "to New York" tells where he went (adverb)

**Verbals** = words derived from verbs but NOT acting as verbs

| Type | Form | Job |
|------|------|-----|
| **Gerund** | verb + -ing | Noun |
| **Participle** | verb + -ing/-ed | Adjective |
| **Infinitive** | to + verb | Noun, Adj, or Adv |

**Test for Gerund vs. Participle:**
- Gerund: *Running is fun.* ("Running" = subject = noun)
- Participle: *The **barking** dog kept us awake.* ("barking" = modifies "dog" = adjective)

**Participle timing:**
- Present participle (-ing): action at SAME time as main verb
- Past participle (-ed): action BEFORE main verb`,
        examples: [
          { sentence: "Determined by cultural factors, the behavior resists simple explanation.", analysis: "'Determined by cultural factors' = Past Participial Phrase. Modifies 'behavior' (adjective). The being 'determined' happened BEFORE the behavior 'resists'." },
          { sentence: "To understand consciousness is the goal of this inquiry.", analysis: "'To understand consciousness' = Infinitive Phrase acting as a NOUN (subject of the sentence)." },
        ],
        drill: [
          { id: "m4-d1", type: "label-parts", sentence: "Convincing the jury required presenting compelling evidence.", question: "What is 'Convincing the jury'?", choices: ["Gerund Phrase (Noun)", "Participial Phrase (Adjective)", "Infinitive Phrase", "Prepositional Phrase"], correctAnswer: "Gerund Phrase (Noun)", explanation: "'Convincing the jury' is a gerund phrase acting as the subject of the sentence — it names the action being discussed. It does the job of a noun." },
          { id: "m4-d2", type: "label-parts", sentence: "The theory, having been thoroughly tested, was finally accepted.", question: "What is 'having been thoroughly tested'?", choices: ["Participial Phrase (Adjective)", "Gerund Phrase (Noun)", "Infinitive Phrase (Adverb)", "Independent Clause"], correctAnswer: "Participial Phrase (Adjective)", explanation: "'having been thoroughly tested' is a present perfect participial phrase. It acts as an adjective modifying 'theory.' The testing happened BEFORE the acceptance." },
        ],
      },
    ],
  },
  {
    id: "module-5",
    number: 5,
    title: "Rhetoric & Reading Texts",
    description: "Essay types, gross morphology, rhetorical cues, and how to find the Key Clause.",
    cambridge_reference: "Cambridge Learning Center — Module 5",
    lessons: [
      {
        id: "m5-rhetoric",
        title: "Gross Morphology & Rhetorical Cues",
        concept: "Every essay has a predictable structure. Rhetorical cues signal key sentences.",
        explanation: `**Gross Morphology of an Essay:**
- **Thesis Paragraph** (usually first): contains the Main Idea + Key Sentences that blueprint the essay
- **Body Paragraphs**: each develops or proves one key idea from the thesis
- **Conclusion**: synthesizes and reinforces the main idea

**Gross Morphology of a Paragraph:**
- **Topic Sentence** (almost always FIRST): states the main idea of the paragraph
- **Conclusion Sentence** (almost always LAST): states WHY the paragraph's info matters
- Other key sentences are signaled by **Rhetorical Cues**

**Rhetorical Cues** = signals that a sentence contains a KEY IDEA:

| Cue Type | Examples | Signal |
|----------|---------|--------|
| Contrast | but, however, yet, nevertheless, despite | Highlights an opposing/important point |
| Conclusion | thus, therefore, consequently, hence | Important inference follows |
| Emphasis | especially, above all, indeed, primarily | This sentence is important |
| Enumeration | first, second, third, 1, 2, 3 | List of criteria follows |
| Addition | furthermore, moreover, in addition | Extends the previous key sentence |
| Questions | ? | Author frames an issue |
| Colons/Semicolons | : ; | Explanation or example follows |`,
        examples: [
          { sentence: "However, the most compelling evidence comes from longitudinal studies.", analysis: "CONTRAST CUE: 'However' = the author is about to introduce a point that contradicts or is more important than what came before. This is a KEY SENTENCE." },
          { sentence: "This failure is significant; it reveals a fundamental assumption the theory cannot accommodate.", analysis: "COLON/SEMICOLON CUE: The semicolon signals that the second clause explains or amplifies the first. Both halves are important." },
        ],
        drill: [
          { id: "m5-d1", type: "spot-rhetorical-cue", sentence: "Above all, the author is concerned with demonstrating that language shapes reality.", question: "What rhetorical cue appears in this sentence and what does it signal?", choices: ["Emphasis word — this is a KEY sentence", "Contrast word — introduces an opposing view", "Conclusion word — this follows from prior evidence", "Enumeration — a list follows"], correctAnswer: "Emphasis word — this is a KEY sentence", explanation: "'Above all' is an emphasis word — one of the clearest signals in Cambridge methodology that the following sentence contains a critical idea, likely the main point of the paragraph or passage." },
          { id: "m5-d2", type: "spot-rhetorical-cue", sentence: "Therefore, we must conclude that free will is incompatible with determinism.", question: "What type of rhetorical cue is 'Therefore'?", choices: ["Conclusion word", "Contrast word", "Emphasis word", "Enumeration"], correctAnswer: "Conclusion word", explanation: "'Therefore' is a conclusion word — it signals that what follows is being inferred or derived from the preceding argument. The author is making their key logical move here." },
        ],
      },
      {
        id: "m5-key-clause",
        title: "Finding the Key Clause",
        concept: "Strip every key sentence to its Key Clause: Simple Subject → Verb → Complement.",
        explanation: `**How to Find the Key Clause:**

1. Read the sentence for familiarity
2. Identify if it contains a rhetorical cue (if yes: it's a key sentence)
3. Find the main clause (independent clause)
4. If the main clause is only introductory (e.g., "It is believed that..."), go to the subordinate clause
5. Strip to: **Simple Subject + Verb + Complement**
6. Note modifiers that: limit the subject, show cause and effect, or have their own rhetorical cues

**Example:**
*"It is believed that the cause of World War I was the assassination of Archduke Franz Ferdinand."*
- Main clause: "It is believed" → only introductory, no real content
- Key Clause is in the subordinate clause: **"cause...was...assassination"**
- Key modifier: "of Archduke Franz Ferdinand" — limits WHICH assassination

**After finding the Key Clause:**
- Reflect on the significant language
- Ask: what is this sentence claiming?
- Link it to the paragraph's topic sentence
- Link that to the essay's main idea`,
        examples: [
          { sentence: "What is most striking is that the poem's structure mirrors its content.", analysis: "Main clause: 'What is most striking is' (introductory). Key Clause in subordinate: 'structure mirrors content.' Subject: structure. Verb: mirrors. Complement: content. Key modifier: 'the poem's' (limits WHICH structure)." },
          { sentence: "Despite its apparent simplicity, the argument conceals a profound epistemological claim.", analysis: "Main clause: 'the argument conceals a profound epistemological claim.' Subject: argument. Verb: conceals. Complement: claim. Key modifier: 'profound epistemological' (limits the NATURE of the claim). CONTRAST CUE: 'Despite' signals the important contradiction." },
        ],
        drill: [
          { id: "m5-d3", type: "find-key-clause", sentence: "It must be acknowledged that contemporary democratic institutions have largely failed to address structural inequality.", question: "What is the KEY CLAUSE of this sentence?", choices: ["democratic institutions have failed to address inequality", "It must be acknowledged", "structural inequality exists", "contemporary institutions are flawed"], correctAnswer: "democratic institutions have failed to address inequality", explanation: "'It must be acknowledged that' is introductory — the main clause lacks real idea content. The key clause is in the subordinate: 'democratic institutions have...failed to address...inequality.' Subject: institutions. Verb: failed. Complement: to address inequality." },
        ],
      },
    ],
  },
  {
    id: "module-6",
    number: 6,
    title: "Tone & Points of View",
    description: "Determine author tone from word choices. Identify multiple viewpoints. Understand figurative language.",
    cambridge_reference: "Cambridge Learning Center — Module 6",
    lessons: [
      {
        id: "m6-tone",
        title: "Tone, POV & Figurative Language",
        concept: "Tone = the emotional content of language. Authors reveal position through word choice, not direct statement.",
        explanation: `**Tone** = how the author feels about the subject

**How to determine tone:**
- Focus on **nouns and adjectives** — these carry the most emotional weight
- Look for **connotative meaning** (implied vs. literal)
- Ask: Is the language neutral, positive, negative, ironic?

**Points of View:**
- Authors often **discuss others' positions** without revealing their own directly
- Their **language choices** about those positions reveal their stance
- "Quotation marks" used **ironically** = author disagrees with the quoted idea
- This is heavily tested on MCAT CARS

**Figurative Language:**
- **Simile** = explicit comparison using "like" or "as": *"courage like a lion's"*
- **Metaphor** = implicit/implied comparison: *"her voice is music"*
- Each element represents an idea from the essay
- NEVER read figuratively language literally
- Ask: what does each element of the figure stand for?

**Rule of Transitions:** Every sentence refers back to the previous one (old information) while adding new information. Use this to:
- Track pronoun references
- Follow the thread of an argument
- Recover when you get lost`,
        examples: [
          { sentence: "The 'scientific' consensus on this matter is, to put it charitably, premature.", analysis: "TONE: Skeptical, dismissive. 'Scientific' in quotes = ironic. 'To put it charitably' = the author actually thinks it's worse than 'premature.' The author clearly disagrees with the consensus." },
          { sentence: "The mind is a battlefield where competing impulses wage constant war for dominance.", analysis: "METAPHOR: Mind = battlefield. Impulses = soldiers/combatants. War for dominance = the internal conflict. Each element maps to a psychological concept." },
        ],
        drill: [
          { id: "m6-d1", type: "spot-rhetorical-cue", sentence: "The 'revolutionary' approach proposed by the author amounts to little more than a repackaging of discredited ideas.", question: "What does the author's use of quotes around 'revolutionary' signal?", choices: ["Ironic use — the author rejects the idea that it is revolutionary", "Literal quotation from another source", "Emphasis — it truly is revolutionary", "Uncertainty about the correct term"], correctAnswer: "Ironic use — the author rejects the idea that it is revolutionary", explanation: "In Cambridge methodology, quotation marks around a single word signal ironic usage — the author is using the word to mean the OPPOSITE of its face value. The author clearly thinks this approach is NOT revolutionary." },
        ],
      },
    ],
  },
  {
    id: "module-7",
    number: 7,
    title: "Arcane Passages",
    description: "Intertextual reference, Rule of Transitions, and how to navigate difficult passages.",
    cambridge_reference: "Cambridge Learning Center — Module 7",
    lessons: [
      {
        id: "m7-arcane",
        title: "Intertextual Reference & Rule of Transitions",
        concept: "Every sentence connects to the previous one. Use this to decode unknown terms and track meaning.",
        explanation: `**Intertextual Reference:** When you encounter an unfamiliar term:
1. Look in the SAME sentence — is there a defining phrase or clause?
2. Look at word roots — does the word contain a recognizable root?
3. If no: go to previous key ideas (start with the closest)
4. Look for terms that might define or explain it

**Rule of Transitions:** Old information → New information
- Every sentence refers back to the previous sentence (OLD info)
- And introduces something new (NEW info)
- *"Mary is a friend. **She** attends Harlan High School. **There**, she studies dance."*
  - "She" refers back to "Mary" (old → new)
  - "There" refers back to "Harlan High School" (old → new)

**When you get lost:**
1. Go to the PREVIOUS 2 key ideas
2. See how they relate to each other
3. See how BOTH relate to the key idea you're currently on
4. Use **Cognitive Anchors** — words you understand to build context

**Textual Reference Points:** Any time you're confused:
- Return to the thesis paragraph
- Re-identify the Main Idea
- Ask: how does THIS paragraph/sentence serve the Main Idea?`,
        examples: [
          { sentence: "This epistemological problem — how we can know anything beyond immediate sensation — has occupied philosophers since Descartes.", analysis: "INTERTEXTUAL: 'epistemological problem' is defined in the SAME sentence by the dash: 'how we can know anything beyond immediate sensation.' You don't need to know 'epistemological' — the author defines it for you." },
        ],
        drill: [
          { id: "m7-d1", type: "find-key-clause", sentence: "The concept of 'tacit knowledge' — skills and understandings we possess but cannot fully articulate — fundamentally challenges the view that all knowledge is propositional.", question: "Based on intertextual reference, what does 'tacit knowledge' mean?", choices: ["Skills and understandings we cannot fully articulate", "Formal propositional knowledge", "Knowledge acquired through speech", "Implicit social contracts"], correctAnswer: "Skills and understandings we cannot fully articulate", explanation: "The author defines 'tacit knowledge' directly in the sentence using a dash: 'skills and understandings we possess but cannot fully articulate.' This is intertextual reference at work — always check the immediate sentence first for definitions." },
        ],
      },
    ],
  },
  {
    id: "module-8",
    number: 8,
    title: "Questions & Answers",
    description: "All 8 MCAT CARS question types with step-by-step strategy.",
    cambridge_reference: "Cambridge Learning Center — Module 8",
    lessons: [
      {
        id: "m8-question-types",
        title: "MCAT CARS Question Types & Strategy",
        concept: "CARS tests three areas: Foundations of Comprehension (30%), Reasoning Within the Text (30%), Reasoning Beyond the Text (40%).",
        explanation: `**MCAT CARS Structure:**
- 9 passages | 53 questions | 90 minutes
- ~50% Humanities | ~50% Social Sciences

**8 Question Types:**

| Type | What It Asks | Strategy |
|------|-------------|---------|
| **Main Idea** | What is the central argument/purpose? | Find thesis + conclusion sentences |
| **Key Idea** | What does paragraph X primarily establish? | Find topic + conclusion sentences of that paragraph |
| **Support/Agree** | Which answer provides evidence FOR the claim? | Must be consistent with AND relevant to the claim |
| **Weaken/Contradict** | Which answer most challenges the claim? | Must directly oppose the specific claim |
| **Inference** | What can be concluded/suggested? | Stay CLOSE to the text; fewest logical steps |
| **Analogy** | A:B :: C:? | Understand the RELATIONSHIP first, then apply |
| **Detail** | According to the passage, X is...? | Line reference — go directly to the text |
| **Purpose** | Why does the author mention X? | Ask: how does X serve the Main Idea? |

**Steps for Answering:**
1. Read for familiarity first
2. For short questions: pay attention to every modifier
3. For long questions: disaggregate (subject, verb, complement)
4. Reflect: what is the STRATEGY of this question?
5. For Inference: stay close to language; fewest logical steps = correct answer`,
        examples: [
          { sentence: "The author would most likely agree with which of the following statements?", analysis: "This is a KEY IDEA / SUPPORT question. Find what the author argues, then match the answer that is consistent with AND follows from the main argument. Eliminate any answer that contradicts OR is neutral to the author's position." },
        ],
        drill: [
          { id: "m8-d1", type: "spot-rhetorical-cue", sentence: "Based on the passage, it can be inferred that the author believes classical liberalism underestimates the social foundations of individual liberty.", question: "This is an inference question. What must be true of the correct answer?", choices: ["It must follow from the passage with minimal logical steps", "It must introduce new information not in the passage", "It must be the most extreme interpretation possible", "It must contradict the author's stated position"], correctAnswer: "It must follow from the passage with minimal logical steps", explanation: "Cambridge methodology for Inference questions: the correct answer is the one CLOSEST to the language of the text, requiring the FEWEST steps in logical reasoning. Extreme answers and answers that go beyond the text are always wrong." },
        ],
      },
    ],
  },
  {
    id: "module-9",
    number: 9,
    title: "Rapid Reading: Intervals",
    description: "Stacking technique, analytical vs. impressionistic reading, interval training.",
    cambridge_reference: "Cambridge Learning Center — Module 9",
    lessons: [
      {
        id: "m9-intervals",
        title: "Stacking & Interval Training",
        concept: "Use easier passages for impressionistic reading and harder passages for analytical reading.",
        explanation: `**Stacking** = deciding which passages to tackle first based on difficulty

**How to Stack:**
1. Pick two passages — quickly assess each
2. Ask: Is the subject matter familiar to you?
3. How difficult is the language? Long, complex sentences?
4. Take the **harder passage** for full **Analytical Reading**
5. Take the **easier passage** for **Impressionistic Reading**

**Analytical Reading (Harder Passages):**
- Read EVERY sentence for comprehension
- After each key sentence: find the Key Clause (S + V + C)
- Pick out important modifiers (limit, cause/effect, rhetorical cues)
- "Tell yourself a story" using the language from key ideas
- Determine Main Idea from thesis paragraph

**Impressionistic Reading (Easier Passages):**
- Read sentences for comprehension
- After key sentences: DON'T analyze — just pause and ask:
  - "What's important here?"
  - "What's the point being made?"
- No formula — trust your trained instincts
- Pull out language, consolidate meaning

**Key:** Comprehension, speed, and retention come from SEPARATING what is important from what is inessential.

**Confidence in your Competence:** You're better at this than you think. Trust the method. Trust the training.`,
        examples: [
          { sentence: "After you've done this with the thesis paragraph, determine what the 'Main Idea' is — usually the last sentence of the paragraph or what is repeated, referred to, explained, and/or described throughout.", analysis: "Cambridge methodology: Main Idea = what is REPEATED across the essay + the conclusion sentence of the thesis paragraph. Look for the pattern, not just a single statement." },
        ],
        drill: [
          { id: "m9-d1", type: "spot-rhetorical-cue", sentence: "You are presented with two passages. One discusses the philosophy of language using highly technical vocabulary. The other analyzes a 19th-century novel in accessible prose.", question: "According to Cambridge stacking technique, which passage should you tackle FIRST?", choices: ["The philosophy of language passage (harder — use analytical reading)", "The novel analysis passage (easier — build confidence)", "Both equally — read in order", "Skip the harder one entirely"], correctAnswer: "The philosophy of language passage (harder — use analytical reading)", explanation: "Cambridge stacking: tackle the HARDER passage first with full analytical reading. Use the easier passage for impressionistic reading. This ensures you give your best cognitive energy to the passage that needs it most." },
        ],
      },
    ],
  },
  {
    id: "module-10",
    number: 10,
    title: "Morning Ritual",
    description: "The neurophysiological preparation routine for peak reading performance.",
    cambridge_reference: "Cambridge Learning Center — Module 10",
    lessons: [
      {
        id: "m10-ritual",
        title: "Morning Ritual & Meditation",
        concept: "Mental preparation is a performance variable. Meditation measurably improves CARS performance.",
        explanation: `**Cambridge Learning's Morning Ritual:**

Meditation is not optional — it is a performance tool. Research from Scientific American and neuroscience studies demonstrates that meditation:
- Reduces anxiety and cognitive interference
- Increases prefrontal cortex activation (the reasoning center)
- Improves sustained attention and working memory
- Reduces the "wandering mind" that costs comprehension points

**Practice Protocol:**
1. **Before studying:** 10-15 minutes of focused meditation
2. **Before MCAT test day:** Full morning ritual for peak neurological state
3. **During the exam:** Between passages, take 2-3 slow breaths to reset

**Why this matters for CARS specifically:**
- CARS is 90 minutes of sustained analytical attention
- Anxiety compresses working memory capacity
- A calm, focused mind holds the Main Idea in working memory across 9 passages
- Meditation trains exactly this capacity

**The Cambridge principle:** Comprehension, speed, and retention require not just technique but neurological readiness. You cannot read well when your mind is scattered. The morning ritual creates the optimal state for everything you've learned in Modules 1–9 to work at full power.`,
        examples: [
          { sentence: "The key is having Confidence in your Competence. — Cambridge Learning Center", analysis: "After mastering the methodology, trust matters. Doubt disrupts the reflexive processing that speed and comprehension require. The morning ritual builds this confident, focused state." },
        ],
        drill: [
          { id: "m10-d1", type: "find-key-clause", sentence: "Anxiety about performance reduces the working memory capacity available for the complex reasoning required in CARS.", question: "According to this sentence, what is the DIRECT EFFECT of performance anxiety?", choices: ["Reduces working memory available for reasoning", "Increases reading speed", "Improves focus", "Has no effect on CARS performance"], correctAnswer: "Reduces working memory available for reasoning", explanation: "Key Clause: 'Anxiety...reduces...working memory capacity.' Direct Object/Complement: 'capacity available for complex reasoning.' The sentence states a clear causal relationship: anxiety → reduced working memory → worse CARS performance." },
        ],
      },
    ],
  },
];
