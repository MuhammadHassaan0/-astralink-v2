import { groq, MODEL } from '@/lib/groq'
import { getMind } from '@/lib/minds'
import type { MindId, ArchaeologyTimeline } from '@/types'

export const dynamic = 'force-dynamic'

interface ArchaeologyRequest {
  mindId: MindId
  topic: string
}

function buildArchaeologyPrompt(mind: ReturnType<typeof getMind>, topic: string): string {
  if (!mind) return ''
  const [early, middle, late] = mind.eras
  return `You are generating a Decision Archaeology timeline for ${mind.fullName} on the topic of "${topic}".

This is a scholarly tool. Every position must be traceable to the documented record: ${mind.primarySource}. Secondary sources: ${mind.secondarySources.join(', ')}.

Eras:
• Early (${early.dateRange}): ${early.description}
• Middle (${middle.dateRange}): ${middle.description}
• Late (${late.dateRange}): ${late.description}

Generate a complete timeline showing how ${mind.fullName}'s position on "${topic}" evolved across these three eras.

REQUIREMENTS:
1. Each position is specific and documented — cite concrete episodes, not abstractions
2. "source" names a specific chapter, interview, or documented statement
3. "caused_by" names the specific event or experience that drove this position
4. If a later era's position contradicts an earlier one, set "contradicts_era" and write "contradiction_note" explaining exactly what changed and why
5. "summary" traces the full arc: what changed, why, and what the unresolved tension is (5-7 sentences)
6. Do not invent. If the topic has limited documented coverage, say so in the position text.

Output only valid JSON — no markdown, no explanation:
{
  "mind_id": "${mind.id}",
  "topic": "${topic}",
  "nodes": [
    {
      "era": "early",
      "date_range": "${early.dateRange}",
      "position": "3-4 sentence specific position, grounded in documented events",
      "source": "Specific chapter or source citation",
      "caused_by": "The specific event, encounter, or period that produced this position"
    },
    {
      "era": "middle",
      "date_range": "${middle.dateRange}",
      "position": "...",
      "source": "...",
      "caused_by": "...",
      "contradicts_era": "early",
      "contradiction_note": "What specifically changed and why — only include if genuinely contradicts early position"
    },
    {
      "era": "late",
      "date_range": "${late.dateRange}",
      "position": "...",
      "source": "...",
      "caused_by": "..."
    }
  ],
  "summary": "5-7 sentence arc: the full evolution, what drove it, and the unresolved tension"
}`
}

export async function POST(req: Request) {
  let body: ArchaeologyRequest
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { mindId, topic } = body
  if (!mindId || !topic?.trim()) {
    return new Response('mindId and topic required', { status: 400 })
  }

  const mind = getMind(mindId)
  if (!mind) return new Response('Unknown mindId', { status: 400 })

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      stream: false,
      messages: [{ role: 'user', content: buildArchaeologyPrompt(mind, topic) }],
      max_tokens: 2000,
      temperature: 0.4,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    let timeline: ArchaeologyTimeline
    try {
      timeline = JSON.parse(jsonStr) as ArchaeologyTimeline
    } catch {
      return Response.json({ error: 'Failed to parse model output', raw }, { status: 502 })
    }

    // Ensure required shape
    if (!timeline.nodes || !Array.isArray(timeline.nodes) || timeline.nodes.length === 0) {
      return Response.json({ error: 'Model returned incomplete timeline' }, { status: 502 })
    }

    return Response.json({ timeline })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
