'use client'

import { motion, type Variants } from 'framer-motion'
import Link from 'next/link'
import { MINDS } from '@/lib/minds'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.8, ease: [0.25, 0, 0, 1] },
  }),
}

export default function LandingPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'var(--ink)' }}
    >
      {/* Radial gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(80, 55, 10, 0.55) 0%, rgba(12, 11, 9, 0) 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 px-8 text-center">
        {/* Eyebrow */}
        <motion.p
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            opacity: 0.85,
          }}
        >
          AstraLink · The Chamber · Private Demo
        </motion.p>

        {/* Main title */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-col items-center gap-2"
        >
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              color: 'var(--parchment)',
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
          >
            The
          </span>
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: 'clamp(5rem, 12vw, 10rem)',
              color: 'var(--parchment)',
              letterSpacing: '-0.01em',
              lineHeight: 0.9,
            }}
          >
            Chamber
          </span>
        </motion.div>

        {/* Gold rule */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="w-32"
          style={{ height: '1px', backgroundColor: 'var(--gold)', opacity: 0.5 }}
        />

        {/* Subtitle */}
        <motion.p
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(1rem, 2.2vw, 1.4rem)',
            color: 'var(--muted-light)',
            letterSpacing: '0.02em',
          }}
        >
          Five minds. Still reasoning. Still disagreeing.
        </motion.p>

        {/* Mind chips */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center gap-6 flex-wrap justify-center"
        >
          {MINDS.map((mind) => (
            <div key={mind.id} className="flex items-center gap-2">
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: 'var(--gold)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--muted-light)',
                }}
              >
                {mind.fullName}
              </span>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center gap-4 mt-2"
        >
          <Link
            href="/council"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 400,
              fontSize: '1rem',
              letterSpacing: '0.04em',
              backgroundColor: 'var(--gold)',
              color: 'var(--ink)',
              padding: '0.65rem 1.75rem',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--gold-light)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--gold)')
            }
          >
            Enter the debate
          </Link>
          <Link
            href="/sandbox"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 400,
              fontSize: '1rem',
              letterSpacing: '0.04em',
              backgroundColor: 'transparent',
              color: 'var(--parchment)',
              padding: '0.65rem 1.75rem',
              border: '1px solid var(--gold-border)',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)'
              e.currentTarget.style.color = 'var(--gold-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold-border)'
              e.currentTarget.style.color = 'var(--parchment)'
            }}
          >
            Open the sandbox
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
