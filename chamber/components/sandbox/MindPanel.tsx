'use client'

import { MINDS } from '@/lib/minds'
import type { MindId } from '@/types'

interface Props {
  selected: MindId
  onChange: (id: MindId) => void
}

export default function MindPanel({ selected, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {MINDS.map((mind) => {
        const active = selected === mind.id
        return (
          <button
            key={mind.id}
            onClick={() => onChange(mind.id as MindId)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0.9rem 1.25rem',
              borderLeft: active ? '4px solid var(--gold)' : '4px solid transparent',
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: '1px solid var(--border-light)',
              backgroundColor: active ? 'var(--gold-dim)' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontWeight: 400,
                  fontSize: '1.05rem',
                  color: active ? 'var(--ink)' : 'var(--slate)',
                  lineHeight: 1.2,
                }}
              >
                {mind.fullName}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontWeight: 300,
                  fontSize: '0.5rem',
                  letterSpacing: '0.08em',
                  color: 'var(--muted)',
                  flexShrink: 0,
                  marginLeft: '0.5rem',
                }}
              >
                {mind.lifespan}
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontWeight: 300,
                fontSize: '0.78rem',
                color: 'var(--muted)',
                marginTop: '0.25rem',
                lineHeight: 1.4,
              }}
            >
              {mind.briefDescription}
            </span>
          </button>
        )
      })}
    </div>
  )
}
