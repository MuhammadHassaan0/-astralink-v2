import type { Contradiction } from '@/types'

interface Props {
  contradiction: Contradiction
}

export default function ContradictionPanel({ contradiction }: Props) {
  const { position_a, position_b, note } = contradiction

  return (
    <div
      style={{
        backgroundColor: 'var(--contradiction)',
        border: '1px solid var(--border)',
        padding: '1rem 1.25rem',
        marginBottom: '0',
      }}
    >
      {/* Two-column positions */}
      <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', marginBottom: '0.85rem' }}>
        <div style={{ flex: 1, paddingRight: '1rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.52rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '0.35rem',
            }}
          >
            {position_a.era} period believed:
          </p>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontSize: '0.88rem',
              color: 'var(--slate)',
              lineHeight: 1.6,
            }}
          >
            {position_a.position}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.5rem',
              color: 'var(--muted)',
              marginTop: '0.3rem',
            }}
          >
            {position_a.source}
          </p>
        </div>

        {/* Red divider */}
        <div style={{ width: 1, backgroundColor: 'var(--rust)', opacity: 0.4, flexShrink: 0 }} />

        <div style={{ flex: 1, paddingLeft: '1rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.52rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '0.35rem',
            }}
          >
            {position_b.era} period believed:
          </p>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontSize: '0.88rem',
              color: 'var(--slate)',
              lineHeight: 1.6,
            }}
          >
            {position_b.position}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.5rem',
              color: 'var(--muted)',
              marginTop: '0.3rem',
            }}
          >
            {position_b.source}
          </p>
        </div>
      </div>

      {/* What changed */}
      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: '0.85rem',
          color: 'var(--muted)',
          lineHeight: 1.65,
          borderTop: '1px solid var(--border-light)',
          paddingTop: '0.75rem',
        }}
      >
        {note}
      </p>
    </div>
  )
}
