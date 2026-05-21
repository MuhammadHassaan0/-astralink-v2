'use client'

import { useState } from 'react'

interface Props {
  fromIndex: number
  toIndex: number
  note: string
  totalNodes: number
}

export default function ContradictionThread({ fromIndex, toIndex, note, totalNodes }: Props) {
  const [showTooltip, setShowTooltip] = useState(false)
  const segmentWidth = 100 / (totalNodes - 1)
  const x1 = `${fromIndex * segmentWidth}%`
  const x2 = `${toIndex * segmentWidth}%`
  const midX = `${((fromIndex + toIndex) / 2) * segmentWidth}%`

  return (
    <div style={{ position: 'relative', height: 32, marginTop: '-4px' }}>
      <svg
        width="100%"
        height="32"
        style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <path
          d={`M ${x1} 0 Q ${midX} 28 ${x2} 0`}
          fill="none"
          stroke="var(--rust)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.6"
          style={{ cursor: 'default' }}
        />
        {/* Hover target */}
        <path
          d={`M ${x1} 0 Q ${midX} 28 ${x2} 0`}
          fill="none"
          stroke="transparent"
          strokeWidth="12"
          style={{ cursor: 'help' }}
        />
      </svg>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            left: midX,
            top: 18,
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--ink)',
            color: 'var(--parchment)',
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '0.78rem',
            lineHeight: 1.5,
            padding: '0.45rem 0.7rem',
            maxWidth: 240,
            zIndex: 20,
            pointerEvents: 'none',
            whiteSpace: 'normal',
          }}
        >
          {note}
        </div>
      )}
    </div>
  )
}
