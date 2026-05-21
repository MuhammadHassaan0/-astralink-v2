'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppShell from '@/components/layout/AppShell'
import InterventionBar from '@/components/live/InterventionBar'
import { getMind } from '@/lib/minds'
import type { MindId } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'setup' | 'countdown' | 'speaking' | 'intervening' | 'complete'

type InterventionType = 'redirect' | 'challenge' | 'direct'

interface ResponseEntry {
  type: 'response'
  mindId: MindId
  text: string
}

interface InterventionEntry {
  type: 'intervention'
  interventionType: InterventionType
  text: string
  targetMind?: string
}

type LiveEntry = ResponseEntry | InterventionEntry

// ─── Debate config ────────────────────────────────────────────────────────────

const COUNTDOWN_MS = 6000
const SELECTED_MINDS: MindId[] = ['jobs', 'davinci', 'einstein', 'musk']
const MAX_TURNS = SELECTED_MINDS.length * 2  // 2 full rounds
const QUESTION =
  'Should constraints drive creativity, or does genuine creativity require absolute freedom?'

const ERA_LABEL: Record<string, string> = { early: 'Early', middle: 'Middle', late: 'Late' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResponseRow({ entry, streaming }: { entry: ResponseEntry; streaming?: boolean }) {
  const mind = getMind(entry.mindId)
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: streaming ? 0.65 : 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0, 0, 1] }}
      style={{ display: 'flex', gap: 0, marginBottom: '1px' }}
    >
      <div
        style={{
          width: 160,
          flexShrink: 0,
          backgroundColor: 'rgba(244,239,229,0.03)',
          padding: '1.1rem 1rem 1.1rem 1.25rem',
          borderRight: '1px solid rgba(244,239,229,0.06)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 400,
            fontSize: '0.95rem',
            color: 'rgba(244,239,229,0.85)',
            marginBottom: '0.15rem',
          }}
        >
          {mind?.name}
        </p>
        {mind && (
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.44rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {ERA_LABEL[mind.eras[1]?.id ?? 'middle']}
          </p>
        )}
        {streaming && (
          <div style={{ display: 'flex', gap: 3, marginTop: '0.5rem' }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`dot-${i + 1}`}
                style={{
                  display: 'inline-block',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: 'var(--gold)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '1.1rem 1.5rem', backgroundColor: 'rgba(244,239,229,0.02)' }}>
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontSize: '1.05rem',
            lineHeight: 1.85,
            color: 'rgba(244,239,229,0.82)',
          }}
        >
          {entry.text}
          {streaming && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '0.9em',
                backgroundColor: 'var(--gold)',
                marginLeft: 3,
                verticalAlign: 'text-bottom',
                opacity: 0.8,
              }}
            />
          )}
        </p>
      </div>
    </motion.div>
  )
}

const INTERVENTION_LABELS: Record<InterventionType, string> = {
  redirect: 'REDIRECT',
  challenge: 'CHALLENGE',
  direct: 'ASK DIRECT',
}

function InterventionRow({ entry }: { entry: InterventionEntry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        margin: '0.35rem 0',
        padding: '0.55rem 1.25rem',
        borderLeft: '2px solid rgba(200,168,74,0.4)',
        backgroundColor: 'rgba(200,168,74,0.04)',
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.75rem',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '0.44rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          flexShrink: 0,
        }}
      >
        You · {INTERVENTION_LABELS[entry.interventionType]}
        {entry.targetMind ? ` → ${entry.targetMind}` : ''}
      </span>
      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '0.9rem',
          color: 'rgba(244,239,229,0.6)',
          lineHeight: 1.6,
        }}
      >
        &ldquo;{entry.text}&rdquo;
      </p>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LivePage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [entries, setEntries] = useState<LiveEntry[]>([])
  const [streamText, setStreamText] = useState('')
  const [streamIdx, setStreamIdx] = useState(0)
  const [countdown, setCountdown] = useState(1)
  const [nextMindId, setNextMindId] = useState<MindId>('jobs')

  const phaseRef = useRef<Phase>('setup')
  phaseRef.current = phase

  const abortRef = useRef<AbortController | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const entriesRef = useRef<LiveEntry[]>([])
  entriesRef.current = entries
  const endRef = useRef<HTMLDivElement>(null)

  const startStreamingRef = useRef<(turnIdx: number) => void>(null!)
  const startCountdownRef = useRef<(nextIdx: number) => void>(null!)

  startStreamingRef.current = async (turnIdx: number) => {
    if (turnIdx >= MAX_TURNS) { setPhase('complete'); return }

    const mindId = SELECTED_MINDS[turnIdx % SELECTED_MINDS.length]

    clearInterval(countdownTimerRef.current)
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    setPhase('speaking')
    setStreamIdx(turnIdx)
    setStreamText('')

    // Build history from committed response entries
    const history = entriesRef.current
      .filter((e): e is ResponseEntry => e.type === 'response')
      .map((e) => ({ mindId: e.mindId, text: e.text }))

    // Include the most recent intervention if present
    const interventions = entriesRef.current.filter(
      (e): e is InterventionEntry => e.type === 'intervention',
    )
    const lastIntervention = interventions.at(-1)

    let fullText = ''
    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: QUESTION,
          mindId,
          mindIds: SELECTED_MINDS,
          history,
          intervention: lastIntervention
            ? { type: lastIntervention.interventionType, text: lastIntervention.text }
            : undefined,
        }),
        signal: abort.signal,
      })

      if (res.ok && res.body) {
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''

        outer: while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (phaseRef.current !== 'speaking') break

          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue
            let event: Record<string, unknown>
            try { event = JSON.parse(raw) } catch { continue }

            if (event.type === 'token') {
              fullText += event.token as string
              setStreamText(fullText)
            } else if (event.type === 'done') {
              break outer
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
    }

    // Commit entry only if still in speaking phase (not interrupted)
    if (phaseRef.current === 'speaking') {
      if (fullText) {
        setEntries((prev) => [...prev, { type: 'response', mindId, text: fullText }])
      }
      setStreamText('')
      startCountdownRef.current(turnIdx + 1)
    }
  }

  startCountdownRef.current = (nextIdx: number) => {
    if (nextIdx >= MAX_TURNS) { setPhase('complete'); return }

    clearInterval(countdownTimerRef.current)
    const nextMind = SELECTED_MINDS[nextIdx % SELECTED_MINDS.length]
    setNextMindId(nextMind)
    setStreamIdx(nextIdx)
    setPhase('countdown')

    let val = 1
    setCountdown(1)
    countdownTimerRef.current = setInterval(() => {
      if (phaseRef.current !== 'countdown') { clearInterval(countdownTimerRef.current); return }
      val = Math.max(0, val - 100 / COUNTDOWN_MS)
      setCountdown(val)
      if (val <= 0) {
        clearInterval(countdownTimerRef.current)
        startStreamingRef.current(nextIdx)
      }
    }, 100)
  }

  useEffect(
    () => () => {
      abortRef.current?.abort()
      clearInterval(countdownTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length, streamText])

  const handleBegin = () => {
    abortRef.current?.abort()
    clearInterval(countdownTimerRef.current)
    setEntries([])
    setStreamText('')
    setStreamIdx(0)
    setCountdown(1)
    setNextMindId(SELECTED_MINDS[0])
    startStreamingRef.current(0)
  }

  const handleIntervene = () => {
    abortRef.current?.abort()
    clearInterval(countdownTimerRef.current)
    setStreamText('')
    setPhase('intervening')
  }

  const handleInterventionSubmit = (
    type: InterventionType,
    text: string,
    targetMind?: MindId,
  ) => {
    const mind = targetMind ? getMind(targetMind) : undefined
    setEntries((prev) => [
      ...prev,
      { type: 'intervention', interventionType: type, text, targetMind: mind?.name },
    ])
    startCountdownRef.current(streamIdx)
  }

  const handleInterventionCancel = () => {
    startCountdownRef.current(streamIdx)
  }

  const streamingMindId: MindId | undefined =
    phase === 'speaking' ? SELECTED_MINDS[streamIdx % SELECTED_MINDS.length] : undefined

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
        <AnimatePresence mode="wait">
          {phase === 'setup' ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ maxWidth: 560, width: '100%', padding: '2rem' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '0.5rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Live Debate — Autonomous council
                </p>

                <h2
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                    color: 'var(--ink)',
                    lineHeight: 1.3,
                    marginBottom: '2rem',
                  }}
                >
                  {QUESTION}
                </h2>

                <div style={{ marginBottom: '2rem' }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '0.48rem',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      marginBottom: '0.6rem',
                    }}
                  >
                    Participants
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {SELECTED_MINDS.map((id) => {
                      const m = getMind(id)
                      return (
                        <span
                          key={id}
                          style={{
                            fontFamily: 'var(--font-cormorant)',
                            fontWeight: 400,
                            fontSize: '0.9rem',
                            color: 'var(--slate)',
                            padding: '0.2em 0.7em',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {m?.name}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <p
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    fontSize: '0.9rem',
                    lineHeight: 1.75,
                    color: 'var(--muted-light)',
                    marginBottom: '2rem',
                    maxWidth: '46ch',
                  }}
                >
                  The council debates autonomously, each mind speaking in turn. Intervene at
                  any moment to redirect, challenge, or address a mind directly.
                </p>

                <button
                  onClick={handleBegin}
                  style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '0.55rem',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    padding: '0.75em 2em',
                    backgroundColor: 'var(--ink)',
                    color: 'var(--parchment)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Begin Live Debate →
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="debate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Debate canvas */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  backgroundColor: 'var(--ink)',
                }}
              >
                {/* Question header */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem 1rem',
                    borderBottom: '1px solid rgba(244,239,229,0.06)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '0.44rem',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Live Debate · In progress
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      fontSize: '0.95rem',
                      color: 'rgba(244,239,229,0.5)',
                      lineHeight: 1.55,
                    }}
                  >
                    {QUESTION}
                  </p>
                </div>

                {/* Entries */}
                <div>
                  {entries.map((entry, i) =>
                    entry.type === 'intervention' ? (
                      <InterventionRow key={i} entry={entry} />
                    ) : (
                      <ResponseRow key={i} entry={entry} />
                    ),
                  )}

                  {/* Streaming entry */}
                  {phase === 'speaking' && streamingMindId && streamText && (
                    <ResponseRow
                      entry={{ type: 'response', mindId: streamingMindId, text: streamText }}
                      streaming
                    />
                  )}

                  {/* Countdown "next" indicator */}
                  {phase === 'countdown' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className={`dot-${i + 1}`}
                          style={{
                            display: 'inline-block',
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            backgroundColor: 'var(--muted)',
                          }}
                        />
                      ))}
                      <span
                        style={{
                          fontFamily: 'var(--font-dm-mono)',
                          fontSize: '0.44rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                        }}
                      >
                        {getMind(nextMindId)?.name} preparing
                      </span>
                    </motion.div>
                  )}

                  {/* Complete */}
                  {phase === 'complete' && (
                    <div style={{ padding: '2rem 1.5rem' }}>
                      <div
                        style={{
                          height: 1,
                          backgroundColor: 'rgba(200,168,74,0.2)',
                          marginBottom: '1.25rem',
                        }}
                      />
                      <p
                        style={{
                          fontFamily: 'var(--font-cormorant)',
                          fontStyle: 'italic',
                          fontWeight: 300,
                          fontSize: '0.95rem',
                          color: 'var(--muted)',
                        }}
                      >
                        The debate has concluded.
                      </p>
                    </div>
                  )}

                  <div ref={endRef} style={{ height: 1 }} />
                </div>
              </div>

              {/* Intervention bar */}
              <InterventionBar
                countdown={countdown}
                nextMindName={getMind(nextMindId)?.name ?? ''}
                phase={
                  phase as 'countdown' | 'speaking' | 'intervening' | 'complete'
                }
                selectedMinds={SELECTED_MINDS}
                onIntervene={handleIntervene}
                onSubmit={handleInterventionSubmit}
                onCancel={handleInterventionCancel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
