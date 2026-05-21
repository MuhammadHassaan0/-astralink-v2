'use client'

import type { MindId } from '@/types'

const PRESET_QUESTIONS = [
  'What is the relationship between failure and invention?',
  'How do you decide when a thing is finished?',
  'Is it possible to change a system from within it?',
  'What does it mean to build something that lasts?',
  'When should a person act against the consensus of their peers?',
]

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  selectedMinds: MindId[]
  loading: boolean
}

export default function QuestionInput({ value, onChange, onSubmit, selectedMinds, loading }: Props) {
  const canSubmit = value.trim().length > 0 && selectedMinds.length >= 2 && !loading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Preset questions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 1.5rem' }}>
        {PRESET_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onChange(q)}
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: '0.85rem',
              color: value === q ? 'var(--ink)' : 'var(--muted)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              lineHeight: 1.6,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={(e) => {
              if (value !== q) e.currentTarget.style.color = 'var(--muted)'
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) onSubmit() }}
          placeholder="Pose a question to the council…"
          style={{
            flex: 1,
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1rem',
            color: 'var(--ink)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 0,
            padding: '0.6rem 0.9rem',
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-border)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          title={
            selectedMinds.length < 2
              ? 'The council requires at least two minds.'
              : !value.trim()
              ? 'Ask a question first.'
              : undefined
          }
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 400,
            fontSize: '0.95rem',
            letterSpacing: '0.03em',
            color: canSubmit ? 'var(--parchment)' : 'var(--muted)',
            backgroundColor: canSubmit ? 'var(--ink)' : 'var(--warm-deep)',
            border: '1px solid ' + (canSubmit ? 'var(--ink)' : 'var(--border)'),
            borderRadius: 0,
            padding: '0.6rem 1.4rem',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Convening…' : 'Convene'}
        </button>
      </div>

      {selectedMinds.length < 2 && (
        <p
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '0.55rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Select at least two minds to convene the council
        </p>
      )}
    </div>
  )
}
