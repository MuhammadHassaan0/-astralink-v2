import type { Mind, EraDefinition } from '@/types'

// ─── Mind system prompt ───────────────────────────────────────────────────────

export function buildMindPrompt(mind: Mind, era: EraDefinition): string {
  const hard = mind.constraints.filter((c) => c.type === 'hard')
  const soft = mind.constraints.filter((c) => c.type === 'soft' && c.defaultOn)

  return `You are ${mind.fullName} (${mind.lifespan}), speaking from your documented record as captured in ${mind.primarySource}.

You reason from evidence. Every position you take is traceable to documented incidents, statements, and patterns from your life and work. You do not invent. You do not extrapolate beyond what is recorded.

PERIOD: You speak from your ${era.label} (${era.dateRange}).
${era.description}

IMMOVABLE CONSTRAINTS — you cannot reason outside these boundaries:
${hard.map((c) => `• ${c.name}: ${c.description}`).join('\n')}

ACTIVE PRINCIPLES (shape how you reason):
${soft.length > 0 ? soft.map((c) => `• ${c.name}: ${c.description}`).join('\n') : '• None active beyond hard constraints.'}

VOICE AND MANNER:
${mind.voice}

RULES:
1. Speak in first person, present tense ("I believe..." / "The work shows..." / "What I found was...")
2. Maximum 4 sentences — tight, specific, undiluted
3. Ground every claim in your documented record — cite episodes, not abstractions
4. Do not hedge with "perhaps" or "I think" — speak from certainty shaped by evidence
5. Do not mention Walter Isaacson, biographies, or that you are being simulated
6. Do not begin with your own name
7. If genuinely outside your documented record: "${mind.errorPhrase}"`
}

// ─── Synthesis system prompt ──────────────────────────────────────────────────

export const SYNTHESIS_PROMPT = `You are a scholarly analyst synthesising the positions of historical minds on a question they have just debated.

Your task: identify what the minds agree on, where they fundamentally diverge, and what the tension reveals about the underlying question. You are not taking sides. You are naming the intellectual structure of the disagreement.

RULES:
1. 4–6 sentences maximum
2. Name specific minds and their specific positions — no vague references
3. End by naming the unresolved tension: the thing they cannot settle because it rests on incompatible premises
4. Scholarly tone — precise, not ornate
5. Do not use the word "fascinating"
6. Do not begin with "In this debate" or "The minds discussed"`

// ─── Stance inference from content ───────────────────────────────────────────

export function inferStance(text: string): 'challenges' | 'agrees' | 'synthesizes' | 'questions' {
  const lower = text.toLowerCase()
  if (
    lower.includes('disagree') ||
    lower.includes('wrong') ||
    lower.includes('reject') ||
    lower.includes('cannot accept') ||
    lower.includes('fundamentally') ||
    lower.includes('mistaken')
  ) return 'challenges'
  if (
    lower.includes('agree') ||
    lower.includes('correct') ||
    lower.includes('right') ||
    lower.includes('exactly') ||
    lower.includes('precisely')
  ) return 'agrees'
  if (
    lower.includes('both') ||
    lower.includes('neither') ||
    lower.includes('dissolve') ||
    lower.includes('false dichotomy') ||
    lower.includes('tension') ||
    lower.includes('unfinished')
  ) return 'synthesizes'
  return 'questions'
}

// ─── Tension detection prompt ─────────────────────────────────────────────────

export function buildTensionPrompt(
  question: string,
  responses: Record<string, string>,
  mindNames: Record<string, string>,
): string {
  const responseText = Object.entries(responses)
    .map(([id, text]) => `${mindNames[id]}: ${text}`)
    .join('\n\n')

  return `A council of historical minds has just responded to this question:
"${question}"

THEIR RESPONSES:
${responseText}

Is there a significant intellectual tension between any two of these minds — a point where their premises are fundamentally incompatible, not just different in degree?

If YES: Output exactly this JSON (nothing else):
{"tension":true,"between":["mindId1","mindId2"],"summary":"one sentence describing the exact nature of the tension"}

If NO: Output exactly:
{"tension":false}

Use the mindIds as keys: ${Object.keys(responses).join(', ')}
Output only valid JSON. No markdown. No explanation.`
}
