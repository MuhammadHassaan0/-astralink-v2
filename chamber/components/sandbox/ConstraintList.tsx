'use client'

import type { Constraint } from '@/types'
import ConstraintItem from './ConstraintItem'

interface Props {
  constraints: Constraint[]
  activeIds: string[]
  onToggle: (id: string, active: boolean) => void
}

export default function ConstraintList({ constraints, activeIds, onToggle }: Props) {
  const hard = constraints.filter((c) => c.type === 'hard')
  const soft = constraints.filter((c) => c.type === 'soft')

  return (
    <div>
      {/* Hard constraints */}
      {hard.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.5rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--rust)',
              marginBottom: '0.35rem',
            }}
          >
            Hard constraints
          </p>
          {hard.map((c) => (
            <ConstraintItem
              key={c.id}
              constraint={c}
              active={true}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}

      {/* Soft constraints */}
      {soft.length > 0 && (
        <div style={{ marginTop: hard.length > 0 ? '1rem' : 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.5rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '0.35rem',
            }}
          >
            Soft constraints
          </p>
          {soft.map((c) => (
            <ConstraintItem
              key={c.id}
              constraint={c}
              active={activeIds.includes(c.id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
