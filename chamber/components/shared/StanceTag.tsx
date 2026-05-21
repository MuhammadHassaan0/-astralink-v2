import type { Stance } from '@/types'

const STANCE_STYLES: Record<Stance, { bg: string; color: string; label: string }> = {
  challenges:  { bg: 'var(--rust-dim)',                   color: 'var(--rust)',   label: 'Challenges'  },
  synthesizes: { bg: 'rgba(60, 60, 56, 0.10)',            color: 'var(--slate)',  label: 'Synthesizes' },
  agrees:      { bg: 'rgba(40, 80, 40, 0.10)',            color: '#3a6040',       label: 'Agrees'      },
  questions:   { bg: 'var(--gold-dim)',                   color: '#806020',       label: 'Questions'   },
}

export default function StanceTag({ stance }: { stance: Stance }) {
  const s = STANCE_STYLES[stance]
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-dm-mono)',
        fontWeight: 400,
        fontSize: '0.5rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: s.color,
        backgroundColor: s.bg,
        padding: '0.2em 0.55em',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  )
}
