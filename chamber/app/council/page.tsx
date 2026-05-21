'use client'

import { useState, useRef, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import MindSelector from '@/components/council/MindSelector'
import QuestionInput from '@/components/council/QuestionInput'
import DebateStage from '@/components/council/DebateStage'
import type { MindId, DebateEntry } from '@/types'

type ViewState = 'idle' | 'loading' | 'typing' | 'complete'

export default function CouncilPage() {
  const [selectedMinds, setSelectedMinds] = useState<MindId[]>(['jobs', 'davinci', 'einstein'])
  const [question, setQuestion] = useState('')
  const [viewState, setViewState] = useState<ViewState>('idle')
  const [entries, setEntries] = useState<DebateEntry[]>([])
  const [synthesis, setSynthesis] = useState<string | undefined>()
  const [synthStreaming, setSynthStreaming] = useState(false)
  const [tensionMinds, setTensionMinds] = useState<MindId[] | undefined>()
  const [tensionNature, setTensionNature] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const abortRef = useRef<AbortController | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  async function runDebate() {
    if (viewState === 'loading' || viewState === 'typing') return

    // Cancel any in-flight request
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    setViewState('loading')
    setEntries([])
    setSynthesis(undefined)
    setSynthStreaming(false)
    setTensionMinds(undefined)
    setTensionNature(undefined)
    setError(undefined)

    try {
      const res = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, mindIds: selectedMinds }),
        signal: abort.signal,
      })

      if (!res.ok || !res.body) {
        setViewState('idle')
        setError('The council could not convene. Check your connection and try again.')
        return
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })

        // Process all complete SSE lines in buffer
        const lines = buf.split('\n')
        buf = lines.pop() ?? '' // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let event: Record<string, unknown>
          try { event = JSON.parse(raw) } catch { continue }

          const type = event.type as string

          if (type === 'mind_start') {
            const mindId = event.mindId as MindId
            setViewState('typing')
            setEntries((prev) => {
              if (prev.find((e) => e.mind_id === mindId)) return prev
              return [...prev, {
                mind_id: mindId,
                text: '',
                stance: 'questions' as const,
                era_label: '',
                citations: [],
                isStreaming: true,
              }]
            })
          }

          else if (type === 'token') {
            const mindId = event.mindId as string
            const token = event.token as string
            if (mindId === 'synthesis') {
              setSynthesis((prev) => (prev ?? '') + token)
            } else {
              setEntries((prev) =>
                prev.map((e) =>
                  e.mind_id === mindId ? { ...e, text: e.text + token } : e
                )
              )
            }
          }

          else if (type === 'mind_end') {
            const mindId = event.mindId as MindId
            setEntries((prev) =>
              prev.map((e) =>
                e.mind_id === mindId
                  ? {
                      ...e,
                      isStreaming: false,
                      stance: (event.stance as DebateEntry['stance']) ?? 'questions',
                      era_label: (event.eraLabel as string) ?? '',
                      citations: [(event.citation as string) ?? ''],
                    }
                  : e
              )
            )
          }

          else if (type === 'tension_detected') {
            setTensionMinds(event.between as MindId[])
            setTensionNature(event.summary as string)
          }

          else if (type === 'synthesis_start') {
            setSynthStreaming(true)
          }

          else if (type === 'synthesis_end') {
            setSynthStreaming(false)
            setViewState('complete')
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setViewState('idle')
        setError('The council could not convene. Check your connection and try again.')
      }
    }
  }

  // Auto-scroll stage into view when debate begins
  useEffect(() => {
    if (viewState === 'typing' && entries.length === 1) {
      stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [viewState, entries.length])

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
        {/* Setup panel */}
        <div
          style={{
            backgroundColor: 'var(--warm)',
            borderBottom: '1px solid var(--border)',
            padding: '1.25rem 1.75rem',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Section label */}
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.52rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Select minds
          </p>

          <MindSelector selected={selectedMinds} onChange={setSelectedMinds} />

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'var(--border-light)' }} />

          <QuestionInput
            value={question}
            onChange={setQuestion}
            onSubmit={runDebate}
            selectedMinds={selectedMinds}
            loading={viewState === 'loading' || viewState === 'typing'}
          />
        </div>

        {/* Debate stage */}
        <div ref={stageRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <DebateStage
            entries={entries}
            tensionMinds={tensionMinds}
            tensionNature={tensionNature}
            synthesis={synthesis}
            synthesisStreaming={synthStreaming}
            error={error}
            loading={viewState === 'loading'}
          />
        </div>
      </div>
    </AppShell>
  )
}
