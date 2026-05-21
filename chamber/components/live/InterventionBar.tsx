'use client'

import { useState, useEffect } from 'react'
import { getMind } from '@/lib/minds'
import type { MindId } from '@/types'

type InterventionType = 'redirect' | 'challenge' | 'direct'
type BarPhase = 'countdown' | 'speaking' | 'intervening' | 'complete'

interface Props {
  countdown: number
  nextMindName: string
  phase: BarPhase
  selectedMinds: MindId[]
  onIntervene: (type: InterventionType) => void
  onSubmit: (type: InterventionType, text: string, targetMind?: MindId) => void
  onCancel: () => void
}

const LABELS: Record<InterventionType, string> = {
  redirect: 'Redirect',
  challenge: 'Challenge',
  direct: 'Ask Direct',
}

const HINTS: Record<InterventionType, string> = {
  redirect: 'Steer the debate to a new angle',
  challenge: 'Push back on the last claim',
  direct: 'Address one mind with a question',
}

const PLACEHOLDERS: Record<InterventionType, string> = {
  redirect: 'What direction should the debate take?',
  challenge: 'What claim do you push back on?',
  direct: 'What do you ask?',
}

export default function InterventionBar({
  countdown, nextMindName, phase, selectedMinds, onIntervene, onSubmit, onCancel,
}: Props) {
  const [activeType, setActiveType] = useState<InterventionType | null>(null)
  const [inputText, setInputText] = useState('')
  const [directTarget, setDirectTarget] = useState<MindId>(selectedMinds[0])

  useEffect(() => {
    if (phase !== 'intervening') {
      setActiveType(null)
      setInputText('')
    }
  }, [phase])

  const handleTypeClick = (type: InterventionType) => {
    if (phase !== 'intervening') onIntervene(type)
    setActiveType(type)
  }

  const handleSubmit = () => {
    if (!activeType || !inputText.trim()) return
    onSubmit(activeType, inputText.trim(), activeType === 'direct' ? directTarget : undefined)
  }

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'rgba(12,11,9,0.98)',
        borderTop: '1px solid rgba(200,168,74,0.15)',
        padding: phase === 'intervening' ? '1rem 1.5rem' : '0.7rem 1.5rem',
        flexShrink: 0,
      }}
    >
      {/* Countdown track */}
      {phase !== 'intervening' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: 'rgba(200,168,74,0.1)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${countdown * 100}%`,
              backgroundColor: phase === 'speaking' ? 'rgba(200,168,74,0.35)' : 'var(--gold)',
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      )}

      {phase === 'intervening' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Type tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {(['redirect', 'challenge', 'direct'] as InterventionType[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.48rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '0.3em 0.85em',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    activeType === type ? 'var(--gold)' : 'rgba(200,168,74,0.08)',
                  color: activeType === type ? 'var(--ink)' : 'var(--muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {LABELS[type]}
              </button>
            ))}
            {activeType && (
              <span
                style={{
                  marginLeft: '0.5rem',
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                }}
              >
                {HINTS[activeType]}
              </span>
            )}
          </div>

          {/* Direct target */}
          {activeType === 'direct' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.44rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                To:
              </span>
              {selectedMinds.map((id) => {
                const m = getMind(id)
                return (
                  <button
                    key={id}
                    onClick={() => setDirectTarget(id)}
                    style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '0.44rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '0.2em 0.65em',
                      border:
                        directTarget === id
                          ? '1px solid var(--gold)'
                          : '1px solid rgba(244,239,229,0.1)',
                      background: 'none',
                      cursor: 'pointer',
                      color: directTarget === id ? 'var(--gold)' : 'var(--muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {m?.name ?? id}
                  </button>
                )
              })}
            </div>
          )}

          {/* Input row */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={activeType ? PLACEHOLDERS[activeType] : 'Select a type above…'}
              rows={2}
              style={{
                flex: 1,
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '0.95rem',
                color: 'var(--parchment)',
                backgroundColor: 'rgba(244,239,229,0.04)',
                border: '1px solid rgba(200,168,74,0.2)',
                padding: '0.5rem 0.75rem',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.55,
              }}
              autoFocus
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <button
                onClick={handleSubmit}
                disabled={!activeType || !inputText.trim()}
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.48rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '0.45em 1.2em',
                  border: 'none',
                  cursor: !activeType || !inputText.trim() ? 'not-allowed' : 'pointer',
                  backgroundColor:
                    !activeType || !inputText.trim()
                      ? 'rgba(200,168,74,0.2)'
                      : 'var(--gold)',
                  color:
                    !activeType || !inputText.trim() ? 'var(--muted)' : 'var(--ink)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                Send ↵
              </button>
              <button
                onClick={onCancel}
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.44rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0.45em 1.2em',
                  backgroundColor: 'transparent',
                  color: 'var(--muted)',
                  border: '1px solid rgba(244,239,229,0.1)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Status */}
          <p
            style={{
              flex: 1,
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.48rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {phase === 'complete' ? (
              'Debate concluded'
            ) : phase === 'speaking' ? (
              <>Speaking now</>
            ) : (
              <>
                Next:{' '}
                <span style={{ color: 'rgba(244,239,229,0.7)' }}>{nextMindName}</span>
              </>
            )}
          </p>

          {/* Intervention buttons */}
          {phase !== 'complete' && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['redirect', 'challenge', 'direct'] as InterventionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeClick(type)}
                  style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '0.48rem',
                    letterSpacing: '0.11em',
                    textTransform: 'uppercase',
                    padding: '0.35em 0.9em',
                    backgroundColor: 'transparent',
                    color: 'var(--muted)',
                    border: '1px solid rgba(244,239,229,0.14)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
