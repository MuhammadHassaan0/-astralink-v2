'use client'

import { downloadAudit } from '@/lib/audit'
import type { AuditData } from '@/types'

interface Props {
  data: AuditData
}

export default function DecisionAuditButton({ data }: Props) {
  return (
    <button
      onClick={() => downloadAudit(data)}
      style={{
        fontFamily: 'var(--font-dm-mono)',
        fontWeight: 300,
        fontSize: '0.52rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        background: 'none',
        border: '1px solid var(--border-light)',
        padding: '0.4em 0.8em',
        cursor: 'pointer',
        transition: 'color 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--ink)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--muted)'
        e.currentTarget.style.borderColor = 'var(--border-light)'
      }}
    >
      Download audit ↓
    </button>
  )
}
