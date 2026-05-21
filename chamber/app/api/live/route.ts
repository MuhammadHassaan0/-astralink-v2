import { groq, MODEL } from '@/lib/groq'
import { getMind } from '@/lib/minds'
import { buildMindPrompt } from '@/lib/prompts'
import type { MindId } from '@/types'

export const dynamic = 'force-dynamic'

interface HistoryEntry {
  mindId: MindId
  text: string
}

interface LiveRequest {
  question: string
  mindId: MindId
  mindIds: MindId[]
  history: HistoryEntry[]
  intervention?: {
    type: 'redirect' | 'challenge' | 'direct'
    text: string
    targetMind?: string
  }
}

type SSEEvent =
  | { type: 'token'; token: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

function buildLiveUserMessage(
  question: string,
  mindName: string,
  otherNames: string[],
  history: HistoryEntry[],
  getMindName: (id: MindId) => string,
  intervention?: LiveRequest['intervention'],
): string {
  const parts: string[] = []

  parts.push(`The debate question: "${question}"`)

  if (history.length > 0) {
    parts.push('\nWhat has been said so far:')
    for (const entry of history) {
      parts.push(`${getMindName(entry.mindId)}: ${entry.text}`)
    }
  }

  if (intervention) {
    const interventionLabels = {
      redirect: 'The moderator has redirected the debate',
      challenge: 'The moderator is challenging the last claim',
      direct: `The moderator is addressing you directly`,
    }
    parts.push(`\n${interventionLabels[intervention.type]}: "${intervention.text}"`)
  }

  parts.push(
    `\nYou are ${mindName}. Respond in 3-4 sentences. React to what has been said. Ground every claim in your documented record.`,
  )

  return parts.join('\n')
}

export async function POST(req: Request) {
  let body: LiveRequest
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { question, mindId, mindIds, history, intervention } = body
  if (!question?.trim() || !mindId) {
    return new Response('question and mindId required', { status: 400 })
  }

  const mind = getMind(mindId)
  if (!mind) return new Response('Unknown mindId', { status: 400 })

  const era = mind.eras[1] // middle era — the debate era

  const getMindName = (id: MindId) => getMind(id)?.name ?? id
  const otherNames = mindIds.filter((id) => id !== mindId).map(getMindName)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: SSEEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        const completion = await groq.chat.completions.create({
          model: MODEL,
          stream: true,
          messages: [
            { role: 'system', content: buildMindPrompt(mind, era) },
            {
              role: 'user',
              content: buildLiveUserMessage(
                question,
                mind.name,
                otherNames,
                history,
                getMindName,
                intervention,
              ),
            },
          ],
          max_tokens: 200,
          temperature: 0.78,
        })

        for await (const chunk of completion) {
          const token = chunk.choices[0]?.delta?.content ?? ''
          if (token) send({ type: 'token', token })
        }

        send({ type: 'done' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        send({ type: 'error', message })
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
