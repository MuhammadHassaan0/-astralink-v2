import { groq, MODEL } from '@/lib/groq'
import { getMind } from '@/lib/minds'
import { buildMindPrompt, SYNTHESIS_PROMPT, inferStance, buildTensionPrompt } from '@/lib/prompts'
import type { MindId } from '@/types'

export const dynamic = 'force-dynamic'

// ─── SSE event shapes ─────────────────────────────────────────────────────────

type SSEEvent =
  | { type: 'mind_start'; mindId: MindId }
  | { type: 'token'; mindId: MindId | 'synthesis'; token: string }
  | { type: 'mind_end'; mindId: MindId; stance: string; eraLabel: string; citation: string }
  | { type: 'tension_detected'; between: MindId[]; summary: string }
  | { type: 'synthesis_start' }
  | { type: 'synthesis_end' }
  | { type: 'error'; message: string }

// ─── Request schema ───────────────────────────────────────────────────────────

interface DebateRequest {
  question: string
  mindIds: MindId[]
  /** Optional: override active era per mind ('early' | 'middle' | 'late') */
  eras?: Partial<Record<MindId, 'early' | 'middle' | 'late'>>
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: DebateRequest
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { question, mindIds, eras = {} } = body
  if (!question?.trim() || !mindIds?.length) {
    return new Response('question and mindIds required', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: SSEEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        const responses: Record<string, string> = {}

        // ── Each mind speaks in turn ──────────────────────────────────────────
        for (const mindId of mindIds) {
          const mind = getMind(mindId)
          if (!mind) continue

          const eraId = eras[mindId] ?? 'middle'
          const era = mind.eras.find((e) => e.id === eraId) ?? mind.eras[1]

          send({ type: 'mind_start', mindId })

          let fullText = ''
          try {
            const completion = await groq.chat.completions.create({
              model: MODEL,
              stream: true,
              messages: [
                { role: 'system', content: buildMindPrompt(mind, era) },
                { role: 'user', content: question },
              ],
              max_tokens: 220,
              temperature: 0.72,
            })

            for await (const chunk of completion) {
              const token = chunk.choices[0]?.delta?.content ?? ''
              if (token) {
                fullText += token
                send({ type: 'token', mindId, token })
              }
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'LLM error'
            send({ type: 'error', message: `${mind.name}: ${msg}` })
            fullText = `[${mind.name} did not respond — ${msg}]`
          }

          responses[mindId] = fullText

          send({
            type: 'mind_end',
            mindId,
            stance: inferStance(fullText),
            eraLabel: era.label,
            citation: mind.primarySource,
          })
        }

        // ── Tension detection ─────────────────────────────────────────────────
        if (mindIds.length >= 2) {
          try {
            const mindNames: Record<string, string> = {}
            for (const id of mindIds) {
              mindNames[id] = getMind(id)?.name ?? id
            }

            const tensionCompletion = await groq.chat.completions.create({
              model: MODEL,
              stream: false,
              messages: [
                {
                  role: 'user',
                  content: buildTensionPrompt(question, responses, mindNames),
                },
              ],
              max_tokens: 120,
              temperature: 0.3,
            })

            const raw = tensionCompletion.choices[0]?.message?.content?.trim() ?? ''
            // Strip markdown code fences if present
            const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
            const parsed = JSON.parse(jsonStr) as {
              tension: boolean
              between?: string[]
              summary?: string
            }

            if (parsed.tension && parsed.between && parsed.summary) {
              send({
                type: 'tension_detected',
                between: parsed.between as MindId[],
                summary: parsed.summary,
              })
            }
          } catch {
            // Tension detection is best-effort — don't surface errors to client
          }
        }

        // ── Synthesis ─────────────────────────────────────────────────────────
        send({ type: 'synthesis_start' })

        const responseLines = mindIds
          .map((id) => {
            const name = getMind(id)?.name ?? id
            return `${name}: ${responses[id]}`
          })
          .join('\n\n')

        try {
          const synthesisCompletion = await groq.chat.completions.create({
            model: MODEL,
            stream: true,
            messages: [
              { role: 'system', content: SYNTHESIS_PROMPT },
              {
                role: 'user',
                content: `Question: "${question}"\n\nResponses:\n${responseLines}`,
              },
            ],
            max_tokens: 250,
            temperature: 0.6,
          })

          for await (const chunk of synthesisCompletion) {
            const token = chunk.choices[0]?.delta?.content ?? ''
            if (token) {
              send({ type: 'token', mindId: 'synthesis', token })
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Synthesis error'
          send({ type: 'error', message: msg })
        }

        send({ type: 'synthesis_end' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        send({ type: 'error', message: msg })
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
