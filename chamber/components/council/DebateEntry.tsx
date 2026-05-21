'use client'

import { motion } from 'framer-motion'
import { getMind } from '@/lib/minds'
import type { DebateEntry as DebateEntryType } from '@/types'
import StanceTag from '@/components/shared/StanceTag'
import SourceCitation from '@/components/shared/SourceCitation'
import ContradictionPanel from './ContradictionPanel'
import TypingIndicator from './TypingIndicator'

interface Props {
  entry: DebateEntryType
  index: number
}

export default function DebateEntry({ entry, index }: Props) {
  const mind = getMind(entry.mind_id)
  if (!mind) return null

  const era = mind.eras.find((e) => e.label === entry.era_label) ?? mind.eras[0]

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0, 0, 1], delay: index * 0.05 }}
      style={{ opacity: entry.isStreaming ? 0.6 : 1 }}
    >
      {/* Contradiction panel sits above the entry */}
      {entry.contradiction && (
        <ContradictionPanel contradiction={entry.contradiction} />
      )}

      <div
        style={{
          display: 'flex',
          borderTop: index === 0 && !entry.contradiction ? 'none' : '1px solid var(--border-light)',
        }}
      >
        {/* Left column */}
        <div
          style={{
            width: 160,
            flexShrink: 0,
            backgroundColor: 'var(--warm)',
            borderRight: '1px solid var(--border-light)',
            padding: '1.75rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 400,
              fontSize: '1.05rem',
              color: 'var(--ink)',
              lineHeight: 1.2,
            }}
          >
            {mind.name}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontWeight: 400,
              fontSize: '0.52rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {era?.dateRange ?? ''}
          </span>
          {entry.stance && !entry.isStreaming && (
            <div style={{ marginTop: '0.4rem' }}>
              <StanceTag stance={entry.stance} />
            </div>
          )}
          {entry.isStreaming && (
            <div style={{ marginTop: '0.6rem' }}>
              <TypingIndicator />
            </div>
          )}
        </div>

        {/* Right column */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--surface)',
            padding: '1.75rem 2rem',
          }}
        >
          {entry.isStreaming && !entry.text ? (
            <div style={{ paddingTop: '0.35rem' }}>
              <TypingIndicator />
            </div>
          ) : (
            <>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontWeight: 300,
                  fontSize: '1.1rem',
                  lineHeight: 1.9,
                  color: 'var(--ink)',
                }}
              >
                {entry.text}
                {entry.isStreaming && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: '1.1em',
                      backgroundColor: 'var(--gold)',
                      marginLeft: 2,
                      verticalAlign: 'text-bottom',
                      animation: 'dot-pulse 1s infinite',
                    }}
                  />
                )}
              </p>
              {!entry.isStreaming && entry.citations && entry.citations.length > 0 && (
                <SourceCitation citation={entry.citations[0]} />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
