import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/session";
import { generateCARSQuestions } from "@/lib/claude";

const CARS_PASSAGES = [
  {
    id: "p1",
    source: "Philosophy of Ethics",
    text: `The utilitarian tradition in ethics, beginning with Jeremy Bentham and refined by John Stuart Mill, holds that the morally correct action is the one that produces the greatest happiness for the greatest number. This seemingly straightforward principle conceals considerable complexity. What counts as happiness? Whose happiness counts, and how do we weigh competing claims? Mill's famous distinction between higher and lower pleasures attempted to address the concern that a perfectly satisfied pig might, on simple hedonistic grounds, be counted as living better than a dissatisfied Socrates. But this distinction introduces a qualitative judgment that sits uneasily within a framework otherwise committed to aggregating welfare impartially.

Contemporary critics have pressed further. The utilitarian calculus seems to permit, in principle, the sacrifice of individual rights for aggregate benefit. If harvesting the organs of one healthy person would save five dying patients, the utilitarian arithmetic appears favorable. Yet virtually everyone recoils from such a conclusion, suggesting that our moral intuitions track something beyond mere welfare maximization. Deontological theorists, following Kant, argue that persons are ends in themselves, never merely means, and that this dignity places absolute constraints on how we may be treated regardless of consequences.

The debate is not merely academic. Questions about distributive justice, criminal punishment, healthcare allocation, and environmental policy all turn on whether we assess outcomes aggregately or respect inviolable constraints on how individuals may be treated. The philosopher John Rawls sought a middle path through the device of the veil of ignorance: principles of justice are those that rational agents would choose if they did not know their place in the resulting social order. This contractarian approach attempts to derive substantive constraints on distribution from a procedural conception of fairness, without appealing directly to either aggregate welfare or pre-theoretical intuitions about dignity.`,
  },
  {
    id: "p2",
    source: "History of Science",
    text: `The Copernican revolution is typically characterized as a triumph of empirical observation over theological dogma, a moment when the patient accumulation of astronomical data forced the abandonment of an Earth-centered cosmology sanctioned by religious authority. This narrative, while not entirely false, is considerably simplified. Copernicus himself was motivated as much by aesthetic and mathematical considerations as by new observations. The Ptolemaic system, which placed Earth at the center of the universe with planets moving in complex epicycles, actually predicted celestial positions with reasonable accuracy. What troubled Copernicus was not its predictive failure but its mathematical inelegance, the proliferation of ad hoc devices required to make the observations fit.

The reception of heliocentrism also confounds the simple science-versus-religion narrative. Many of the most vigorous opponents of the Copernican model were fellow astronomers motivated by empirical objections — in particular, the failure to detect stellar parallax, the apparent shift in stellar position that should be observable if Earth were indeed orbiting the Sun. The absence of detected parallax was a genuine scientific problem, not simply obscurantism. The stars are simply too distant for the effect to be detectable without telescopes far more powerful than those available in the sixteenth century.

What the Copernican case illustrates is less a conflict between science and religion than a more complex dynamic in which commitments to mathematical beauty, empirical fit, theological consistency, and disciplinary authority all intersected in ways that resist simple narrative reduction. The history of science is populated not by fearless empiricists shedding the chains of superstition but by complex human beings navigating simultaneously between multiple frameworks of authority and value.`,
  },
  {
    id: "p3",
    source: "Literary Criticism",
    text: `The relationship between literature and moral knowledge has been a contested philosophical question since Plato's Republic, where the poet is famously expelled from the ideal city on the grounds that mimetic art corrupts the soul by arousing and indulging the passions rather than subjecting them to rational governance. Aristotle's reply in the Poetics, that tragedy achieves the catharsis of pity and fear, rehabilitates literature as a moral-psychological technology, a controlled enactment of suffering that produces not corruption but therapeutic clarification.

Contemporary debates reproduce this ancient tension. On one side stand those who argue, with Martha Nussbaum, that literature cultivates the moral imagination by extending our understanding of how lives can be shaped by circumstance, compelling us to inhabit perspectives radically different from our own. Novels, on this view, are training grounds for empathy and practical wisdom, faculties that abstract philosophical argument cannot develop because it operates at too great a remove from the particularity of human experience. The very form of the novel, with its attentiveness to individual consciousness, its tracking of moral growth and failure through time, its rendering of the felt texture of deliberation, has something irreplaceable to contribute to ethical understanding.

Against this stands the objection that the moral effects of literature are empirically uncertain, that there is no reliable evidence that reading great novels makes people better, and that the claim to moral knowledge made on behalf of fiction trades on an equivocation between emotional responsiveness and genuine cognitive achievement. Literary engagement may produce vivid imaginative experiences without generating the kind of systematic understanding that philosophical analysis provides.`,
  },
];

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const passageId = searchParams.get("passage") ?? "p1";
  const passage = CARS_PASSAGES.find((p) => p.id === passageId) ?? CARS_PASSAGES[0];
  return NextResponse.json(passage);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { passage, count = 6 } = await request.json();
    const questions = await generateCARSQuestions(passage, count);
    return NextResponse.json({ questions });
  } catch (err) {
    console.error("CARS API error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
