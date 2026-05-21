'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/council', label: 'Council' },
  { href: '/sandbox', label: 'Sandbox' },
  { href: '/archaeology', label: 'Archaeology' },
  { href: '/live', label: 'Live' },
  { href: '/map', label: 'Map' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header
      style={{
        backgroundColor: 'var(--parchment)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 400,
            fontSize: '1.15rem',
            color: 'var(--ink)',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          The <em>Chamber</em>
        </Link>

        {/* Mode navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontWeight: 400,
                  fontSize: '0.95rem',
                  letterSpacing: '0.02em',
                  color: isActive ? 'var(--ink)' : 'var(--muted)',
                  textDecoration: 'none',
                  paddingBottom: '3px',
                  borderBottom: isActive
                    ? '1px solid var(--gold)'
                    : '1px solid transparent',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--ink)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--muted)'
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Label */}
        <span
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontWeight: 400,
            fontSize: '0.55rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          AstraLink · Private Demo
        </span>
      </div>
    </header>
  )
}
