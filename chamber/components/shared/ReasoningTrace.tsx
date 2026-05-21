'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { ReasoningTrace as TraceType } from '@/types'

interface Props {
  trace: TraceType
  defaultExpanded?: boolean
}

export default function ReasoningTrace({ trace, defaultExpanded = false }: Props) {
  const [open, setOpen] = useState(defaultExpanded)

  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        backgroundColor: 'var(--warm)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.7rem 1rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderBottom: open ? '1px solid var(--border-light)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontWeight: 400,
              fontSize: '0.52rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Reasoning trace
          </span>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: 'var(--gold)',
              display: 'inline-block',
            }}
          />
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: 'var(--muted)', display: 'flex' }}
        >
          <ChevronDown size={12} strokeWidth={1.5} />
        </motion.div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="trace-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {trace.steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: '0.5rem',
                    padding: '0.45rem 0',
                    borderBottom: i < trace.steps.length - 1 ? '1px solid var(--border-light)' : 'none',
                    backgroundColor:
                      step.label === 'Hypothetical'
                        ? 'var(--hypothetical)'
                        : 'transparent',
                    marginLeft: step.label === 'Hypothetical' ? '-1rem' : 0,
                    marginRight: step.label === 'Hypothetical' ? '-1rem' : 0,
                    paddingLeft: step.label === 'Hypothetical' ? '1rem' : 0,
                    paddingRight: step.label === 'Hypothetical' ? '1rem' : 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontWeight: 400,
                      fontSize: '0.5rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      paddingTop: '0.15rem',
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    style={{
                      fontFamily:
                        step.label === 'Source'
                          ? 'var(--font-cormorant)'
                          : 'var(--font-cormorant)',
                      fontStyle: step.label === 'Source' ? 'italic' : 'normal',
                      fontWeight: 300,
                      fontSize: '0.82rem',
                      color: 'var(--slate)',
                      lineHeight: 1.55,
                    }}
                  >
                    {step.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
