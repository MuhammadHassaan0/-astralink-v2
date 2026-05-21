'use client'

import { useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function HypotheticalInput({ value, onChange }: Props) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '0.52rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: '0.6rem',
        }}
      >
        Hypothetical condition
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="What if…"
        rows={3}
        style={{
          width: '100%',
          fontFamily: focused && value ? 'var(--font-cormorant)' : 'var(--font-cormorant)',
          fontStyle: value || focused ? 'italic' : 'italic',
          fontWeight: 300,
          fontSize: '0.9rem',
          color: 'var(--ink)',
          backgroundColor: 'var(--hypothetical)',
          border: focused
            ? '1px dashed var(--gold-border)'
            : '1px dashed var(--border-light)',
          borderRadius: 0,
          padding: '0.6rem 0.75rem',
          resize: 'none',
          outline: 'none',
          lineHeight: 1.65,
          transition: 'border-color 0.2s ease',
          caretColor: 'var(--gold)',
        }}
      />
      {value && (
        <p
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '0.5rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginTop: '0.35rem',
          }}
        >
          Active — output will flag extrapolated sentences
        </p>
      )}
    </div>
  )
}
