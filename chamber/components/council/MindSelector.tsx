'use client'

import { MINDS } from '@/lib/minds'
import type { MindId } from '@/types'

interface Props {
  selected: MindId[]
  onChange: (ids: MindId[]) => void
}

export default function MindSelector({ selected, onChange }: Props) {
  function toggle(id: MindId) {
    if (selected.includes(id)) {
      if (selected.length > 1) onChange(selected.filter((s) => s !== id))
    } else {
      if (selected.length < 5) onChange([...selected, id])
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
      {MINDS.map((mind) => {
        const active = selected.includes(mind.id as MindId)
        return (
          <button
            key={mind.id}
            onClick={() => toggle(mind.id as MindId)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0.5rem 0.85rem',
              border: active ? '1px solid var(--border)' : '1px solid var(--border)',
              borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
              borderRadius: 0,
              backgroundColor: active ? 'var(--ink)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              minWidth: '6rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontWeight: 400,
                fontSize: '0.95rem',
                color: active ? 'var(--parchment)' : 'var(--slate)',
                lineHeight: 1.2,
              }}
            >
              {mind.name}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontWeight: 300,
                fontSize: '0.5rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: active ? 'var(--muted-light)' : 'var(--muted)',
                marginTop: '0.2rem',
              }}
            >
              {mind.lifespan}
            </span>
          </button>
        )
      })}
    </div>
  )
}
