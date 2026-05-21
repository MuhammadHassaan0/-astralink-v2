'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  topic: string
  era: 'early' | 'middle' | 'late'
  text: string
  citation: string
  onClose: () => void
}

export default function NodeDetail({ topic, era, text, citation, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: [0.25, 0, 0, 1] }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        backgroundColor: 'rgba(12, 11, 9, 0.96)',
        borderLeft: '1px solid rgba(200, 168, 74, 0.2)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        overflowY: 'auto',
        zIndex: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.5rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: '0.3rem',
            }}
          >
            {era}
          </p>
          <h3
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: '1.3rem',
              color: 'var(--parchment)',
              lineHeight: 1.2,
            }}
          >
            {topic}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            padding: '0.25rem',
            flexShrink: 0,
          }}
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Rule */}
      <div style={{ height: 1, backgroundColor: 'rgba(200, 168, 74, 0.2)' }} />

      {/* Spoken text */}
      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontWeight: 300,
          fontSize: '1rem',
          lineHeight: 1.9,
          color: 'var(--parchment)',
          opacity: 0.9,
          flex: 1,
        }}
      >
        {text}
      </p>

      {/* Citation */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'var(--gold)',
            flexShrink: 0,
            marginTop: '0.3em',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '0.52rem',
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}
        >
          {citation}
        </span>
      </div>
    </motion.div>
  )
}
