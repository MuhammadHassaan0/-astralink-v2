'use client'

import { useState } from 'react'
import { getMind, MINDS } from '@/lib/minds'
import type { MindId } from '@/types'

const PRESET_TOPICS: Record<MindId, string[]> = {
  jobs: ['simplicity', 'death', 'open systems', 'market research', 'design'],
  davinci: ['observation', 'unfinished work', 'anatomy', 'flight', 'water'],
  einstein: ['quantum mechanics', 'unified field', 'intuition', 'authority', 'pacifism'],
  franklin: ['coalition', 'utility', 'diplomacy', 'slavery', 'humor'],
  musk: ['first principles', 'deadlines', 'empathy', 'regulation', 'multiplanetary'],
}

interface Props {
  selectedMind: MindId
  onMindChange: (id: MindId) => void
  topic: string
  onTopicChange: (t: string) => void
  onSearch: (overrideTopic?: string) => void
  loading?: boolean
}

export default function TopicSearch({ selectedMind, onMindChange, topic, onTopicChange, onSearch, loading }: Props) {
  const presets = PRESET_TOPICS[selectedMind] ?? []

  return (
    <div
      style={{
        backgroundColor: 'var(--warm)',
        borderBottom: '1px solid var(--border)',
        padding: '1.25rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        flexShrink: 0,
      }}
    >
      {/* Mind chips */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '0.5rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginRight: '0.25rem',
            flexShrink: 0,
          }}
        >
          Mind
        </span>
        {MINDS.map((m) => {
          const active = m.id === selectedMind
          return (
            <button
              key={m.id}
              onClick={() => onMindChange(m.id as MindId)}
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontWeight: active ? 400 : 300,
                fontSize: '0.9rem',
                color: active ? 'var(--ink)' : 'var(--muted)',
                background: 'none',
                border: 'none',
                padding: '0.1rem 0',
                paddingBottom: '0.2rem',
                borderBottom: active ? '1px solid var(--gold)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {m.name}
            </button>
          )
        })}
      </div>

      {/* Topic input + presets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && topic.trim()) onSearch(topic) }}
            placeholder={`Trace ${getMind(selectedMind)?.name}'s position on…`}
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
              padding: '0.55rem 0.85rem',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-border)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={() => onSearch(topic)}
            disabled={!topic.trim() || loading}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.52rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: topic.trim() && !loading ? 'var(--parchment)' : 'var(--muted)',
              backgroundColor: topic.trim() && !loading ? 'var(--ink)' : 'var(--warm-deep)',
              border: '1px solid ' + (topic.trim() && !loading ? 'var(--ink)' : 'var(--border)'),
              borderRadius: 0,
              padding: '0.55rem 1.25rem',
              cursor: topic.trim() && !loading ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'Excavating…' : 'Excavate'}
          </button>
        </div>

        {/* Preset topics */}
        <div style={{ display: 'flex', gap: '0.4rem 1rem', flexWrap: 'wrap' }}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => { onTopicChange(p); onSearch(p) }}
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '0.82rem',
                color: topic === p ? 'var(--ink)' : 'var(--muted)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={(e) => { if (topic !== p) e.currentTarget.style.color = 'var(--muted)' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
