import { groq, MODEL } from '@/lib/groq'
import { getMind } from '@/lib/minds'
import { buildMindPrompt } from '@/lib/prompts'
import type { MindId, TraceStep } from '@/types'

export const dynamic = 'force-dynamic'

// ─── Request schema ───────────────────────────────────────────────────────────

interface SandboxRequest {
  mindId: MindId
  eraId: 'early' | 'middle' | 'late'
  question: string
  activeConstraintIds: string[]
  hypothetical?: string
}

// ─── SSE events ───────────────────────────────────────────────────────────────

type SSEEvent =
  | { type: 'trace'; steps: TraceStep[] }
  | { type: 'token'; token: string }
  | { type: 'hypothetical_sentences'; indices: number[] }
  | { type: 'done' }
  | { type: 'error'; message: string }

// ─── Trace generation prompt ──────────────────────────────────────────────────

function buildTracePrompt(
  mindName: string,
  eraLabel: string,
  eraRange: string,
  primarySource: string,
  question: string,
  constraintNames: string[],
  hypothetical?: string,
): string {
  return `Generate a reasoning trace showing exactly how ${mindName} processes this question during their ${eraLabel} period (${eraRange}).

Question: "${question}"
Primary source: ${primarySource}
Active constraints: ${constraintNames.join(', ') || 'none'}${hypothetical ? `\nHypothetical scenario in play: "${hypothetical}"` : ''}

Generate 5–6 trace steps. Use only these labels (pick the most relevant):
- "Era Context" — how the ${eraLabel} period specifically shapes the answer
- "Constraint" — which constraint applies most directly, and how (include the constraint name)
- "Retrieval" — which specific documented episodes, chapters, or sources are most relevant (be specific — name chapters or incidents)
- "Pattern" — the characteristic reasoning method this mind uses for this type of question
- "Hypothesis" — (only if hypothetical is provided) how the hypothetical shifts or extends the documented position
- "Source" — the exact primary source citation

Output as a JSON array only. No markdown fences, no explanation, no text before or after:
[{"label":"Era Context","value":"..."},{"label":"Retrieval","value":"..."},...]`
}

// ─── Hypothetical sentence detection prompt ───────────────────────────────────

function buildHypotheticalDetectionPrompt(
  hypothetical: string,
  sentences: string[],
): string {
  const numbered = sentences.map((s, i) => `[${i}] ${s}`).join('\n')
  return `A response was generated with this hypothetical scenario applied: "${hypothetical}"

The response sentences (0-indexed):
${numbered}

Which sentences are extrapolations that only hold true within the hypothetical — i.e., they go beyond the mind's documented positions and rely on the hypothetical being true?

Output a JSON array of indices only. Example: [2, 4] or []. No markdown, no explanation.`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: SandboxRequest
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { mindId, eraId, question, activeConstraintIds, hypothetical } = body
  if (!mindId || !question?.trim()) {
    return new Response('mindId and question required', { status: 400 })
  }

  const mind = getMind(mindId)
  if (!mind) return new Response('Unknown mindId', { status: 400 })

  const era = mind.eras.find((e) => e.id === eraId) ?? mind.eras[1]
  const activeConstraints = mind.constraints.filter(
    (c) => c.type === 'hard' || activeConstraintIds.includes(c.id),
  )
  const constraintNames = activeConstraints.map((c) => c.name)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: SSEEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        // ── Step 1: Generate reasoning trace ─────────────────────────────────
        let traceSteps: TraceStep[] = []
        try {
          const traceCompletion = await groq.chat.completions.create({
            model: MODEL,
            stream: false,
            messages: [
              {
                role: 'user',
                content: buildTracePrompt(
                  mind.fullName,
                  era.label,
                  era.dateRange,
                  mind.primarySource,
                  question,
                  constraintNames,
                  hypothetical,
                ),
              },
            ],
            max_tokens: 400,
            temperature: 0.3,
          })

          const raw = traceCompletion.choices[0]?.message?.content?.trim() ?? ''
          const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
          const parsed = JSON.parse(jsonStr)
          if (Array.isArray(parsed)) {
            traceSteps = parsed.filter(
              (s) => typeof s.label === 'string' && typeof s.value === 'string',
            )
          }
        } catch {
          // Fallback trace if parsing fails
          traceSteps = [
            { label: 'Era Context', value: `${era.label} (${era.dateRange})` },
            { label: 'Source', value: mind.primarySource },
          ]
        }

        send({ type: 'trace', steps: traceSteps })

        // ── Step 2: Stream the response ───────────────────────────────────────
        const systemPrompt = buildMindPrompt(mind, era)
        const userMessage = hypothetical?.trim()
          ? `${question}\n\nHYPOTHETICAL SCENARIO TO ENGAGE WITH: "${hypothetical}"\nReason from within this hypothetical. Your documented constraints still apply, but engage directly with this scenario.`
          : question

        let fullResponse = ''
        try {
          const responseCompletion = await groq.chat.completions.create({
            model: MODEL,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 240,
            temperature: 0.75,
          })

          for await (const chunk of responseCompletion) {
            const token = chunk.choices[0]?.delta?.content ?? ''
            if (token) {
              fullResponse += token
              send({ type: 'token', token })
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'LLM error'
          send({ type: 'error', message: msg })
        }

        // ── Step 3: Detect hypothetical sentences (if applicable) ─────────────
        if (hypothetical?.trim() && fullResponse) {
          try {
            // Split into sentences using punctuation boundaries
            const sentences = fullResponse
              .split(/(?<=[.!?])\s+/)
              .map((s) => s.trim())
              .filter(Boolean)

            const detectionCompletion = await groq.chat.completions.create({
              model: MODEL,
              stream: false,
              messages: [
                {
                  role: 'user',
                  content: buildHypotheticalDetectionPrompt(hypothetical, sentences),
                },
              ],
              max_tokens: 60,
              temperature: 0.1,
            })

            const raw = detectionCompletion.choices[0]?.message?.content?.trim() ?? '[]'
            const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
            const indices = JSON.parse(jsonStr)
            if (Array.isArray(indices)) {
              send({ type: 'hypothetical_sentences', indices: indices.filter((i) => typeof i === 'number') })
            }
          } catch {
            send({ type: 'hypothetical_sentences', indices: [] })
          }
        }

        send({ type: 'done' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        send({ type: 'error', message: msg })
        send({ type: 'done' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
