'use client'

import { useState, useMemo, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import MindPanel from '@/components/sandbox/MindPanel'
import EraSlider from '@/components/sandbox/EraSlider'
import ConstraintList from '@/components/sandbox/ConstraintList'
import HypotheticalInput from '@/components/sandbox/HypotheticalInput'
import SandboxOutput from '@/components/sandbox/SandboxOutput'
import { MINDS, getMind } from '@/lib/minds'
import type { MindId, Era, ReasoningTrace } from '@/types'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SandboxPage() {
  const [selectedMind, setSelectedMind] = useState<MindId>('jobs')
  const [selectedEra, setSelectedEra] = useState<Era>('late')
  const [activeConstraintIds, setActiveConstraintIds] = useState<string[]>(() => {
    const mind = MINDS.find((m) => m.id === 'jobs')!
    return mind.constraints.filter((c) => c.defaultOn && c.type === 'soft').map((c) => c.id)
  })
  const [hypothetical, setHypothetical] = useState('')
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [trace, setTrace] = useState<ReasoningTrace | undefined>()
  const [error, setError] = useState<string | undefined>()
  const abortRef = useRef<AbortController | null>(null)

  const mind = getMind(selectedMind)!

  function handleMindChange(id: MindId) {
    setSelectedMind(id)
    const m = getMind(id)!
    setActiveConstraintIds(m.constraints.filter((c) => c.defaultOn && c.type === 'soft').map((c) => c.id))
    setSelectedEra('late')
    setResponse('')
    setTrace(undefined)
  }

  function handleConstraintToggle(id: string, active: boolean) {
    setActiveConstraintIds((prev) =>
      active ? [...prev, id] : prev.filter((c) => c !== id)
    )
  }

  const activeConstraints = useMemo(
    () => mind.constraints.filter((c) => c.type === 'hard' || activeConstraintIds.includes(c.id)),
    [mind.constraints, activeConstraintIds],
  )

  const currentEra = mind.eras.find((e) => e.id === selectedEra) ?? mind.eras[0]

  async function askMind() {
    if (isStreaming) return

    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    setResponse('')
    setTrace(undefined)
    setError(undefined)
    setIsStreaming(true)

    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mindId: selectedMind,
          eraId: selectedEra,
          question,
          activeConstraintIds,
          hypothetical: hypothetical.trim() || undefined,
        }),
        signal: abort.signal,
      })

      if (!res.ok || !res.body) {
        setIsStreaming(false)
        setError('The mind could not be reached. Check your connection and try again.')
        return
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })

        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let event: Record<string, unknown>
          try { event = JSON.parse(raw) } catch { continue }

          const type = event.type as string

          if (type === 'trace') {
            const steps = event.steps as ReasoningTrace['steps']
            setTrace({ steps, hypotheticalSentences: [] })
          }

          else if (type === 'token') {
            setResponse((prev) => prev + (event.token as string))
          }

          else if (type === 'hypothetical_sentences') {
            const indices = event.indices as number[]
            setTrace((prev) => prev ? { ...prev, hypotheticalSentences: indices } : prev)
          }

          else if (type === 'done') {
            setIsStreaming(false)
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setIsStreaming(false)
        setError('The mind could not be reached. Check your connection and try again.')
      }
    }
  }

  return (
    <AppShell>
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 52px)',
          overflow: 'hidden',
        }}
      >
        {/* Left panel — 300px fixed */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            backgroundColor: 'var(--warm)',
            borderRight: '1px solid var(--border)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Mind selector */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '0.5rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                padding: '0.85rem 1.25rem 0.5rem',
              }}
            >
              Select mind
            </p>
            <MindPanel selected={selectedMind} onChange={handleMindChange} />
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-light)', flexShrink: 0 }} />

          {/* Era slider */}
          <div style={{ padding: '1rem 1.25rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '0.5rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '0.85rem',
              }}
            >
              Pin era
            </p>
            <EraSlider
              eras={mind.eras}
              selected={selectedEra}
              onChange={setSelectedEra}
            />
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-light)', flexShrink: 0 }} />

          {/* Constraints */}
          <div style={{ padding: '1rem 1.25rem' }}>
            <ConstraintList
              constraints={mind.constraints}
              activeIds={activeConstraintIds}
              onToggle={handleConstraintToggle}
            />
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-light)', flexShrink: 0 }} />

          {/* Hypothetical */}
          <div style={{ padding: '1rem 1.25rem' }}>
            <HypotheticalInput value={hypothetical} onChange={setHypothetical} />
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-light)', flexShrink: 0 }} />

          {/* Question + Ask */}
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '0.5rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              Question
            </p>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question…"
              rows={3}
              style={{
                width: '100%',
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '0.9rem',
                color: 'var(--ink)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 0,
                padding: '0.5rem 0.7rem',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.65,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-border)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={askMind}
              disabled={isStreaming || !question.trim()}
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontWeight: 400,
                fontSize: '0.95rem',
                letterSpacing: '0.03em',
                color: !isStreaming && question.trim() ? 'var(--parchment)' : 'var(--muted)',
                backgroundColor: !isStreaming && question.trim() ? 'var(--ink)' : 'var(--warm-deep)',
                border: '1px solid ' + (!isStreaming && question.trim() ? 'var(--ink)' : 'var(--border)'),
                borderRadius: 0,
                padding: '0.55rem 0',
                cursor: !isStreaming && question.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
            >
              {isStreaming ? 'Reasoning…' : `Ask ${mind.name}`}
            </button>
          </div>
        </div>

        {/* Right panel — output */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Output header */}
          <div
            style={{
              padding: '0.85rem 2.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flexShrink: 0,
              backgroundColor: 'var(--warm)',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontWeight: 400,
                  fontSize: '1.05rem',
                  color: 'var(--ink)',
                }}
              >
                {mind.fullName}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                  marginLeft: '0.75rem',
                }}
              >
                {currentEra.label} · {currentEra.dateRange}
              </span>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              {activeConstraints
                .filter((c) => c.type === 'hard')
                .map((c) => (
                  <span
                    key={c.id}
                    style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '0.44rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--rust)',
                      backgroundColor: 'var(--rust-dim)',
                      padding: '0.15em 0.5em',
                      borderRadius: 2,
                    }}
                  >
                    {c.name}
                  </span>
                ))}
            </div>
          </div>

          <SandboxOutput
            response={response}
            isStreaming={isStreaming}
            trace={trace}
            hypothetical={hypothetical.trim() || undefined}
            mind={mind}
            era={currentEra}
            activeConstraints={activeConstraints}
            question={question}
            error={error}
          />
        </div>
      </div>
    </AppShell>
  )
}
