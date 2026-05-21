'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import TopicSearch from '@/components/archaeology/TopicSearch'
import EvolutionTimeline from '@/components/archaeology/EvolutionTimeline'
import type { MindId, ArchaeologyTimeline } from '@/types'

// ─── Seed timelines (shown before first search) ───────────────────────────────

const MOCK_TIMELINES: Record<string, ArchaeologyTimeline> = {
  'jobs-simplicity': {
    mind_id: 'jobs',
    topic: 'Simplicity',
    nodes: [
      {
        era: 'early',
        date_range: '1976–1984',
        position:
          'Simplicity as aesthetic instinct — a preference inherited from Zen Buddhism and the Bauhaus-influenced design of the Whole Earth Catalog. At this stage it operates more as taste than as engineering principle.',
        source: 'Ch. 4, Steve Jobs, Isaacson (2011)',
        caused_by: 'Early exposure to Zen practice in Reed College years, and the design clarity of the Apple I and II.',
      },
      {
        era: 'middle',
        date_range: '1985–1997',
        position:
          'Simplicity sharpened by failure. The NeXT machine was too pure — $6,500 with no market. The lesson refined: simplicity must serve real constraints. Pixar clarified it further: the story must be simple, everything else can be complex.',
        source: 'Ch. 16, Steve Jobs, Isaacson (2011)',
        caused_by: "NeXT commercial failure, followed by Pixar's narrative demands.",
        contradicts_era: 'early',
        contradiction_note:
          'Early era simplicity was absolute — the NeXT failure demonstrated that simplicity detached from utility collapses into purity. The middle era position added a constraint: simplicity must be earned by understanding the real problem.',
      },
      {
        era: 'late',
        date_range: '1997–2011',
        position:
          'Simplicity as civilisational principle, not just design choice. "You have to work hard to get your thinking clean to make it simple." The iPod, iPhone, and App Store all demonstrate this: the hard work is the decision about what to leave out.',
        source: 'Ch. 24 — "Design Principles", Steve Jobs, Isaacson (2011)',
        caused_by: 'Return to Apple, confronting the bloated product line, and the design partnership with Jony Ive.',
      },
    ],
    summary:
      'Jobs began with simplicity as aesthetic instinct — a sensibility, not a system. The NeXT failure made it concrete: simplicity without utility is decoration. The return to Apple forged the final position, where simplicity becomes the hardest engineering problem of all, because it requires understanding what to remove rather than what to add. The position did not reverse — it deepened. The early Jobs trusted his taste. The late Jobs understood why his taste was correct.',
  },

  'jobs-death': {
    mind_id: 'jobs',
    topic: 'Death',
    nodes: [
      {
        era: 'early',
        date_range: '1976–1984',
        position:
          "Death as distant abstraction. The focus was entirely on creation, product, urgency. Mortality was not yet a present force — it was the vague backdrop of the Whole Earth Catalog's \"stay hungry, stay foolish.\"",
        source: 'Ch. 3, Steve Jobs, Isaacson (2011)',
        caused_by: 'Youth, the urgency of building Apple from a garage, no direct encounter with mortality.',
      },
      {
        era: 'middle',
        date_range: '1985–1997',
        position:
          'Death as occasional reference — the Dylan lyrics, the countercultural inheritance. Still not personal. The exile from Apple was experienced more as a kind of death than actual mortality.',
        source: 'Ch. 14, Steve Jobs, Isaacson (2011)',
        caused_by: 'Firing from Apple experienced as existential loss — but recoverable.',
      },
      {
        era: 'late',
        date_range: '1997–2011',
        position:
          '"Remembering that you are going to die is the best way I know to avoid the trap of thinking you have something to lose." Death as the supreme clarifying force, the eliminator of external expectations, the reason to pursue what matters. Operative in every major product decision from 2004 onward.',
        source: 'Stanford Commencement Address (2005); Ch. 36, Steve Jobs, Isaacson (2011)',
        caused_by: '2003 pancreatic cancer diagnosis. The Stanford address was the first public articulation of a private reckoning that had been underway for two years.',
      },
    ],
    summary:
      'The transformation here is complete and non-reversible. Early Jobs did not think about death. Late Jobs thought about it every morning. The 2003 cancer diagnosis was the singular event — the Stanford address its public form, but the private reckoning began the moment he heard the diagnosis and refused surgery for nine months. Death moved from abstraction to design principle. It is now legible in the product decisions: the radical simplification of the iPhone interface, the single-button philosophy, the refusal to add. When you know you will die, you stop adding.',
  },

  'einstein-quantum': {
    mind_id: 'einstein',
    topic: 'Quantum mechanics',
    nodes: [
      {
        era: 'early',
        date_range: '1895–1915',
        position:
          'Einstein himself initiated quantum theory — the photoelectric effect paper (1905) introduced the photon and earned the Nobel Prize. He accepted discontinuity in energy as a real physical phenomenon, even when it contradicted wave theory.',
        source: 'Ch. 5 — "The Miracle Year", Einstein: His Life and Universe, Isaacson (2007)',
        caused_by: 'Planck\'s blackbody radiation problem (1900). Einstein extended Planck\'s quantization from radiation to light itself.',
      },
      {
        era: 'middle',
        date_range: '1915–1933',
        position:
          'Growing unease. The Bohr-Einstein debates at Solvay (1927) mark the turning point. Einstein accepts that quantum mechanics produces correct predictions but refuses to accept that it is complete. "God does not play dice." The EPR thought experiment is already forming.',
        source: 'Ch. 20 — "The Quantum Conundrum", Einstein: His Life and Universe, Isaacson (2007)',
        caused_by: 'The Copenhagen interpretation, championed by Bohr — which asserted that quantum states have no definite values until measured.',
        contradicts_era: 'early',
        contradiction_note:
          'The early Einstein invented key elements of quantum mechanics; the middle Einstein became its most formidable critic. He never rejected its predictions — only its philosophical completeness. The shift was from "this is a useful tool" to "this cannot be the final word."',
      },
      {
        era: 'late',
        date_range: '1933–1955',
        position:
          'Full opposition, documented. The EPR paper (1935) argued that quantum mechanics is incomplete — that local hidden variables must exist to explain entanglement without "spooky action at a distance." Died in this position, never reconciled.',
        source: 'Einstein, Podolsky, Rosen (1935); Ch. 23, Einstein: His Life and Universe, Isaacson (2007)',
        caused_by: 'The EPR paper was the formal expression of a twenty-year intuition: that reality exists independently of observation.',
      },
    ],
    summary:
      'The quantum trajectory is the great irony of Einstein\'s intellectual life. He helped create quantum mechanics — the photoelectric effect is foundational — then spent forty years arguing that it was incomplete. The shift was not a rejection of the mathematics, which he knew were correct, but a rejection of the Copenhagen interpretation\'s philosophical claim that quantum mechanics described all of physical reality. Einstein\'s realism — his belief that the moon exists when no one looks at it — was non-negotiable. Bell\'s theorem (1964, posthumous) and subsequent experiments ultimately sided against Einstein\'s hidden variables position. He died on the wrong side of this argument, by the standards of modern physics.',
  },

  'musk-firstprinciples': {
    mind_id: 'musk',
    topic: 'First principles reasoning',
    nodes: [
      {
        era: 'early',
        date_range: '1995–2008',
        position:
          'First principles applied to survival problems. At Zip2 and PayPal, the method appears as aggressive cost decomposition and refusal to accept industry norms as constraints. At SpaceX: why does a rocket cost $65M? Break it into materials. Materials cost $2M. The rest is "industry markup on stupidity."',
        source: 'Ch. 4, Elon Musk, Isaacson (2023)',
        caused_by: 'Physics training at Queen\'s and Penn, combined with existential financial pressure — SpaceX had three rockets to prove the model before money ran out.',
      },
      {
        era: 'middle',
        date_range: '2008–2018',
        position:
          'First principles becomes explicit doctrine, taught to engineers. The question is always: "What does physics allow?" not "What has been done?" The Falcon 9 reusability question: can you physically land a rocket? Yes. Therefore do it. Applied to battery costs, solar efficiency, tunnel boring speed.',
        source: 'Ch. 17, Elon Musk, Isaacson (2023)',
        caused_by: 'SpaceX\'s 2008 survival and subsequent success created institutional confidence in the method.',
      },
      {
        era: 'late',
        date_range: '2018–2023',
        position:
          'First principles as identity more than method. The reasoning is still present but increasingly used to justify decisions already made — particularly at Twitter, where "what does physics allow?" was replaced by "what do I want to do?" The gap between claimed and actual method widens.',
        source: 'Ch. 38, Ch. 42, Elon Musk, Isaacson (2023)',
        caused_by: 'Twitter acquisition introduced domain (social dynamics, moderation) where physics-based reasoning does not straightforwardly apply.',
      },
    ],
    summary:
      'First principles reasoning is the most consistent and the most documented feature of Musk\'s cognition across all eras. It originated as a survival tool — at SpaceX, it was the only way to make the numbers work. It became a production method in the middle era, explicitly taught, producing the Falcon 9 reusability breakthrough. The late era shows the first evidence of the gap between claimed method and actual practice — Twitter decisions driven by intuition and impulse, retrospectively justified using first-principles language. The method remains genuine in engineering contexts; its application to social and political problems is less rigorous.',
  },
}

function getSeedKey(mind: MindId, topic: string): string {
  const t = topic.toLowerCase().replace(/\s+/g, '')
  return `${mind}-${t}`
}

export default function ArchaeologyPage() {
  const [selectedMind, setSelectedMind] = useState<MindId>('jobs')
  const [topic, setTopic] = useState('simplicity')
  const [timeline, setTimeline] = useState<ArchaeologyTimeline | undefined>(
    MOCK_TIMELINES['jobs-simplicity']
  )
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | undefined>()

  async function handleSearch(overrideTopic?: string) {
    const t = (overrideTopic ?? topic).trim()
    if (loading || !t) return

    // Update displayed topic if using override
    if (overrideTopic && overrideTopic !== topic) setTopic(overrideTopic)

    // Check seed data first (instant)
    const seedKey = getSeedKey(selectedMind, t)
    if (MOCK_TIMELINES[seedKey]) {
      setTimeline(MOCK_TIMELINES[seedKey])
      setNotFound(false)
      return
    }

    // Fetch from real API
    setLoading(true)
    setTimeline(undefined)
    setNotFound(false)
    setError(undefined)

    try {
      const res = await fetch('/api/archaeology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mindId: selectedMind, topic: t }),
      })
      const data = await res.json() as { timeline?: ArchaeologyTimeline; error?: string }

      if (res.ok && data.timeline) {
        setTimeline(data.timeline)
      } else if (res.status === 404) {
        setNotFound(true)
      } else {
        setError('The record could not be retrieved. Check your connection and try again.')
      }
    } catch {
      setError('The record could not be retrieved. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleMindChange(id: MindId) {
    setSelectedMind(id)
    setTimeline(undefined)
    setNotFound(false)
    setError(undefined)
    setTopic('')
  }

  return (
    <AppShell>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 52px)',
          overflow: 'hidden',
        }}
      >
        <TopicSearch
          selectedMind={selectedMind}
          onMindChange={handleMindChange}
          topic={topic}
          onTopicChange={setTopic}
          onSearch={handleSearch}
          loading={loading}
        />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--surface)',
            padding: '2.5rem 2rem',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '12rem',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`dot-${i + 1}`}
                    style={{
                      display: 'inline-block',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: 'var(--gold)',
                    }}
                  />
                ))}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.48rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Excavating the record…
              </p>
            </div>
          ) : timeline ? (
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
              <EvolutionTimeline timeline={timeline} />
            </div>
          ) : error ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '12rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '1rem',
                  color: 'var(--rust)',
                  textAlign: 'center',
                  maxWidth: '32rem',
                  lineHeight: 1.8,
                }}
              >
                {error}
              </p>
            </div>
          ) : notFound ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '12rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '1rem',
                  color: 'var(--muted-light)',
                  textAlign: 'center',
                  maxWidth: '32rem',
                  lineHeight: 1.8,
                }}
              >
                No documented position found on &ldquo;{topic}&rdquo; for this mind in the
                corpus. Try a different topic or mind.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '12rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '1rem',
                  color: 'var(--muted-light)',
                }}
              >
                Select a mind and a topic to begin excavation.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
