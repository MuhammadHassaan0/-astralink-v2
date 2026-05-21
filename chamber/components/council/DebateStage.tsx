'use client'

import type { DebateEntry as DebateEntryType } from '@/types'
import DebateEntry from './DebateEntry'
import SynthesisPanel from './SynthesisPanel'
import TensionBanner from './TensionBanner'
import type { MindId } from '@/types'

interface Props {
  entries: DebateEntryType[]
  tensionMinds?: MindId[]
  tensionNature?: string
  synthesis?: string
  synthesisStreaming?: boolean
  error?: string
  loading?: boolean
}

export default function DebateStage({
  entries,
  tensionMinds,
  tensionNature,
  synthesis,
  synthesisStreaming,
  error,
  loading,
}: Props) {
  const centeredStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '16rem',
    gap: '0.75rem',
  }

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--surface)', overflowY: 'auto' }}>
      {tensionMinds && tensionMinds.length >= 2 && tensionNature && (
        <TensionBanner minds={tensionMinds} nature={tensionNature} />
      )}

      {error ? (
        <div style={centeredStyle}>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: '1rem',
              color: 'var(--rust)',
              textAlign: 'center',
              maxWidth: '28rem',
              lineHeight: 1.7,
            }}
          >
            {error}
          </p>
        </div>
      ) : loading && entries.length === 0 ? (
        <div style={centeredStyle}>
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`dot-${i + 1}`}
                style={{
                  display: 'inline-block',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: 'var(--gold)',
                }}
              />
            ))}
          </div>
          <p className="mono-label">Convening the council…</p>
        </div>
      ) : entries.length === 0 ? (
        <div style={centeredStyle}>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: '1rem',
              color: 'var(--muted-light)',
            }}
          >
            The council awaits a question.
          </p>
        </div>
      ) : (
        <div>
          {entries.map((entry, i) => (
            <DebateEntry key={`${entry.mind_id}-${i}`} entry={entry} index={i} />
          ))}
          {(synthesis || synthesisStreaming) && (
            <SynthesisPanel
              text={synthesis ?? ''}
              isStreaming={synthesisStreaming}
            />
          )}
        </div>
      )}
    </div>
  )
}
