'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import TimelineNode from './TimelineNode'
import ContradictionThread from './ContradictionThread'
import type { ArchaeologyTimeline } from '@/types'
import type { Era } from '@/types'

const ERA_ORDER: Era[] = ['early', 'middle', 'late']

interface Props {
  timeline: ArchaeologyTimeline
}

export default function EvolutionTimeline({ timeline }: Props) {
  const [activeEra, setActiveEra] = useState<Era>('early')

  const orderedNodes = ERA_ORDER.map((era) =>
    timeline.nodes.find((n) => n.era === era)
  ).filter(Boolean) as typeof timeline.nodes

  const contradictions = timeline.nodes.filter((n) => n.contradicts_era)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0, 0, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
    >
      {/* Topic header */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '0.52rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '0.4rem',
          }}
        >
          Tracing position across eras
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            color: 'var(--ink)',
            lineHeight: 1.2,
          }}
        >
          {timeline.topic}
        </h2>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', padding: '0 2rem' }}>
        {/* Horizontal track */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '2rem',
            right: '2rem',
            height: 1,
            backgroundColor: 'var(--border)',
            zIndex: 1,
          }}
        />

        {/* Nodes row */}
        <div style={{ display: 'flex', position: 'relative', zIndex: 2, alignItems: 'flex-start' }}>
          {orderedNodes.map((node, i) => {
            const hasContradiction =
              node.contradicts_era !== undefined ||
              contradictions.some((c) => c.contradicts_era === node.era)
            return (
              <TimelineNode
                key={node.era}
                node={node}
                active={activeEra === node.era}
                hasContradiction={hasContradiction}
                onActivate={() => setActiveEra(node.era)}
              />
            )
          })}
        </div>

        {/* Contradiction thread(s) */}
        {contradictions.map((c) => {
          if (!c.contradicts_era) return null
          const fromIdx = ERA_ORDER.indexOf(c.era)
          const toIdx = ERA_ORDER.indexOf(c.contradicts_era)
          return (
            <div
              key={`${c.era}-${c.contradicts_era}`}
              style={{ position: 'relative', marginTop: '-8px' }}
            >
              <ContradictionThread
                fromIndex={fromIdx}
                toIndex={toIdx}
                note={c.contradiction_note ?? ''}
                totalNodes={3}
              />
            </div>
          )
        })}

        {/* Era labels */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: contradictions.length ? '0.5rem' : '1.5rem',
          }}
        >
          {ERA_ORDER.map((era) => (
            <span
              key={era}
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '0.5rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: activeEra === era ? 'var(--gold)' : 'var(--muted)',
                flex: 1,
                textAlign: era === 'early' ? 'left' : era === 'late' ? 'right' : 'center',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onClick={() => setActiveEra(era)}
            >
              {era}
            </span>
          ))}
        </div>
      </div>

      {/* "What changed and why" summary */}
      <div
        style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: '1.75rem',
          maxWidth: '62ch',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '0.5rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '0.75rem',
          }}
        >
          What changed and why
        </p>
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '1.05rem',
            lineHeight: 1.85,
            color: 'var(--slate)',
          }}
        >
          {timeline.summary}
        </p>
      </div>
    </motion.div>
  )
}
