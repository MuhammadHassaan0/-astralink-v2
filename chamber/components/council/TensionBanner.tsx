'use client'

import { motion } from 'framer-motion'
import { getMind } from '@/lib/minds'
import type { MindId } from '@/types'

interface Props {
  minds: MindId[]
  nature: string
}

export default function TensionBanner({ minds, nature }: Props) {
  const nameA = getMind(minds[0])?.name ?? minds[0]
  const nameB = getMind(minds[1])?.name ?? minds[1]

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0, 0, 1] }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem',
        padding: '0.85rem 1.5rem',
        backgroundColor: 'var(--tension)',
        borderBottom: '1px solid var(--gold-border)',
      }}
    >
      {/* Gold diamond */}
      <div
        style={{
          width: 8,
          height: 8,
          backgroundColor: 'var(--gold)',
          transform: 'rotate(45deg)',
          flexShrink: 0,
          marginTop: '0.35em',
        }}
      />
      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontWeight: 300,
          fontSize: '0.9rem',
          color: 'var(--slate)',
          lineHeight: 1.7,
        }}
      >
        <span style={{ fontWeight: 400, color: 'var(--ink)' }}>
          Documented tension detected between {nameA} and {nameB}:
        </span>{' '}
        {nature}
      </p>
    </motion.div>
  )
}
