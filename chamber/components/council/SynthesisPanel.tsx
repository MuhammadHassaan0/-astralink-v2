'use client'

import { motion } from 'framer-motion'

interface Props {
  text: string
  isStreaming?: boolean
}

export default function SynthesisPanel({ text, isStreaming }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0, 0, 1] }}
      style={{
        backgroundColor: 'var(--warm-deep)',
        borderTop: '1px solid var(--gold-border)',
        padding: '2rem 2.5rem',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontWeight: 400,
          fontSize: '0.55rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: '1rem',
        }}
      >
        Synthesis
      </p>
      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: '1.05rem',
          lineHeight: 1.85,
          color: 'var(--slate)',
          maxWidth: '72ch',
        }}
      >
        {text}
        {isStreaming && (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: '1em',
              backgroundColor: 'var(--gold)',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              animation: 'dot-pulse 1s infinite',
            }}
          />
        )}
      </p>
    </motion.div>
  )
}
