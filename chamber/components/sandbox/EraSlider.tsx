'use client'

import type { Era, EraDefinition } from '@/types'

interface Props {
  eras: EraDefinition[]
  selected: Era
  onChange: (era: Era) => void
}

export default function EraSlider({ eras, selected, onChange }: Props) {
  const currentIndex = eras.findIndex((e) => e.id === selected)
  const current = eras[currentIndex]

  return (
    <div style={{ padding: '0 0.25rem' }}>
      {/* Current era label */}
      <div style={{ marginBottom: '0.9rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontWeight: 400,
            fontSize: '0.52rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '0.2rem',
          }}
        >
          {current?.label ?? ''}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontWeight: 300,
            fontSize: '0.58rem',
            color: 'var(--muted)',
            letterSpacing: '0.06em',
          }}
        >
          {current?.dateRange ?? ''}
        </p>
      </div>

      {/* Track + stops */}
      <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
        {/* Track line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: 'var(--border)',
            transform: 'translateY(-50%)',
          }}
        />
        {/* Progress fill */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: `${(currentIndex / (eras.length - 1)) * 100}%`,
            height: 1,
            backgroundColor: 'var(--gold)',
            transform: 'translateY(-50%)',
            transition: 'width 0.3s ease',
          }}
        />
        {/* Stop circles */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {eras.map((era, i) => {
            const isActive = era.id === selected
            const isPast = i < currentIndex
            return (
              <button
                key={era.id}
                onClick={() => onChange(era.id)}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: isActive ? 'none' : `1px solid ${isPast ? 'var(--gold)' : 'var(--border)'}`,
                  backgroundColor: isActive
                    ? 'var(--gold)'
                    : isPast
                    ? 'var(--gold)'
                    : 'var(--warm)',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 0 3px var(--gold-dim)' : 'none',
                }}
                title={era.label}
              />
            )
          })}
        </div>
      </div>

      {/* Era labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {eras.map((era) => (
          <button
            key={era.id}
            onClick={() => onChange(era.id)}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontWeight: 300,
              fontSize: '0.48rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: era.id === selected ? 'var(--gold)' : 'var(--muted)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
          >
            {era.id}
          </button>
        ))}
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: '0.8rem',
          color: 'var(--muted)',
          lineHeight: 1.6,
          marginTop: '0.75rem',
        }}
      >
        {current?.description ?? ''}
      </p>
    </div>
  )
}
