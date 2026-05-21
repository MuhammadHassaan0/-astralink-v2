'use client'

import { useState, useRef } from 'react'
import { Lock } from 'lucide-react'
import type { Constraint } from '@/types'

interface Props {
  constraint: Constraint
  active: boolean
  onToggle: (id: string, active: boolean) => void
}

export default function ConstraintItem({ constraint, active, onToggle }: Props) {
  const [shaking, setShaking] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [evidenceExpanded, setEvidenceExpanded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleHardClick() {
    setShaking(true)
    setShowTooltip(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setShaking(false)
      setShowTooltip(false)
    }, 2200)
  }

  if (constraint.type === 'hard') {
    return (
      <div
        style={{
          padding: '0.7rem 0',
          borderBottom: '1px solid var(--border-light)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
          {/* Lock icon — clickable, shakes on click */}
          <button
            onClick={handleHardClick}
            className={shaking ? 'shake' : ''}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'not-allowed',
              flexShrink: 0,
              marginTop: '0.1rem',
              color: 'var(--rust)',
            }}
          >
            <Lock size={12} strokeWidth={1.5} />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontWeight: 400,
                  fontSize: '0.9rem',
                  color: 'var(--ink)',
                }}
              >
                {constraint.name}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.44rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--rust)',
                  backgroundColor: 'var(--rust-dim)',
                  padding: '0.15em 0.4em',
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              >
                Immovable
              </span>
            </div>

            {/* Evidence — truncated, expandable */}
            <button
              onClick={() => setEvidenceExpanded((p) => !p)}
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontWeight: 300,
                fontStyle: 'italic',
                fontSize: '0.75rem',
                color: 'var(--muted)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                lineHeight: 1.5,
                marginTop: '0.25rem',
                display: '-webkit-box',
                WebkitLineClamp: evidenceExpanded ? undefined : 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: evidenceExpanded ? 'visible' : 'hidden',
              }}
            >
              {constraint.evidence}
            </button>
          </div>
        </div>

        {/* Shake tooltip */}
        {showTooltip && (
          <div
            style={{
              position: 'absolute',
              left: '1.5rem',
              bottom: '100%',
              marginBottom: '0.4rem',
              backgroundColor: 'var(--ink)',
              color: 'var(--parchment)',
              fontFamily: 'var(--font-cormorant)',
              fontStyle: 'italic',
              fontSize: '0.78rem',
              lineHeight: 1.5,
              padding: '0.5rem 0.75rem',
              maxWidth: '220px',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            This constraint is immovable.{' '}
            <span style={{ fontStyle: 'normal', color: 'var(--muted-light)' }}>
              ({constraint.source})
            </span>
          </div>
        )}
      </div>
    )
  }

  // Soft constraint
  return (
    <div
      style={{
        padding: '0.7rem 0',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
        {/* Custom toggle */}
        <button
          onClick={() => onToggle(constraint.id, !active)}
          role="switch"
          aria-checked={active}
          style={{
            width: 28,
            height: 16,
            borderRadius: 8,
            backgroundColor: active ? 'var(--gold)' : 'var(--border)',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            position: 'relative',
            flexShrink: 0,
            marginTop: '0.2rem',
            transition: 'background-color 0.2s ease',
          }}
        >
          <span
            style={{
              display: 'block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#fff',
              position: 'absolute',
              top: 2,
              left: active ? 14 : 2,
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 400,
              fontSize: '0.9rem',
              color: active ? 'var(--ink)' : 'var(--muted)',
              transition: 'color 0.2s ease',
            }}
          >
            {constraint.name}
          </span>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: '0.72rem',
              color: 'var(--muted)',
              lineHeight: 1.5,
              marginTop: '0.2rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {constraint.evidence}
          </p>
        </div>
      </div>
    </div>
  )
}
