'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Era } from '@/types'

interface NodeData {
  era: Era
  date_range: string
  position: string
  source: string
  caused_by?: string
  contradicts_era?: Era
  contradiction_note?: string
}

interface Props {
  node: NodeData
  active: boolean
  hasContradiction: boolean
  onActivate: () => void
}

const ERA_LABELS: Record<Era, string> = { early: 'Early', middle: 'Middle', late: 'Late' }

export default function TimelineNode({ node, active, hasContradiction, onActivate }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      {/* Circle */}
      <button
        onClick={onActivate}
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: hasContradiction
            ? '2px solid var(--rust)'
            : active
            ? 'none'
            : '1px solid var(--border)',
          backgroundColor: active
            ? 'var(--gold)'
            : hasContradiction
            ? 'var(--rust-dim)'
            : 'var(--warm)',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
          transition: 'all 0.2s ease',
          boxShadow: active ? '0 0 0 4px var(--gold-dim)' : 'none',
          position: 'relative',
          zIndex: 2,
        }}
        title={ERA_LABELS[node.era]}
      />

      {/* Card — expands below */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] }}
            style={{
              marginTop: '1rem',
              backgroundColor: hasContradiction ? 'rgba(138,56,40,0.04)' : 'var(--surface)',
              border: hasContradiction ? '1px solid rgba(138,56,40,0.2)' : '1px solid var(--border-light)',
              padding: '1rem 1.1rem',
              maxWidth: 260,
              width: '100%',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '0.5rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: hasContradiction ? 'var(--rust)' : 'var(--gold)',
                marginBottom: '0.5rem',
              }}
            >
              {ERA_LABELS[node.era]} · {node.date_range}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontWeight: 300,
                fontSize: '0.95rem',
                color: 'var(--ink)',
                lineHeight: 1.7,
                marginBottom: '0.6rem',
              }}
            >
              {node.position}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '0.5rem',
                color: 'var(--muted)',
                marginBottom: node.caused_by ? '0.5rem' : 0,
              }}
            >
              {node.source}
            </p>
            {node.caused_by && (
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  lineHeight: 1.55,
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '0.5rem',
                }}
              >
                Caused by: {node.caused_by}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
