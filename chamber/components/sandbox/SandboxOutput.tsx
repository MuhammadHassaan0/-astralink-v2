'use client'

import ReasoningTrace from '@/components/shared/ReasoningTrace'
import DecisionAuditButton from '@/components/shared/DecisionAuditButton'
import type { ReasoningTrace as TraceType, Mind, EraDefinition, Constraint, AuditData } from '@/types'

interface Props {
  response: string
  isStreaming: boolean
  trace?: TraceType
  hypothetical?: string
  mind: Mind
  era: EraDefinition
  activeConstraints: Constraint[]
  question: string
  error?: string
}

export default function SandboxOutput({
  response,
  isStreaming,
  trace,
  hypothetical,
  mind,
  era,
  activeConstraints,
  question,
  error,
}: Props) {
  if (error) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2.5rem',
        }}
      >
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
    )
  }

  if (!response && !isStreaming) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2.5rem',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '1rem',
            color: 'var(--muted-light)',
            textAlign: 'center',
          }}
        >
          Configure the mind and ask a question.
        </p>
      </div>
    )
  }

  // Split response into sentences for hypothetical highlighting
  const sentences = response.split(/(?<=[.!?])\s+/)
  const hypotheticalIndices = trace?.hypotheticalSentences ?? []

  const auditData: AuditData = {
    question,
    mind,
    era,
    activeConstraints,
    retrievedChunks: [],
    trace: trace ?? { steps: [], hypotheticalSentences: [] },
    response,
    contradictions: [],
    hypothetical,
    timestamp: new Date().toLocaleString(),
  }

  return (
    <div
      style={{
        flex: 1,
        padding: '2rem 2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        overflowY: 'auto',
      }}
    >
      {/* Hypothetical banner */}
      {hypothetical && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            padding: '0.65rem 0.9rem',
            backgroundColor: 'var(--hypothetical)',
            border: '1px dashed var(--gold-border)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.5rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              flexShrink: 0,
              paddingTop: '0.1rem',
            }}
          >
            Hypothetical
          </span>
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: '0.88rem',
              color: 'var(--slate)',
              lineHeight: 1.55,
            }}
          >
            "{hypothetical}"
          </span>
        </div>
      )}

      {/* Response text */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontSize: '1.15rem',
            lineHeight: 2.0,
            color: 'var(--ink)',
          }}
        >
          {sentences.map((sentence, i) => {
            const isHypothetical = hypotheticalIndices.includes(i)
            return (
              <span
                key={i}
                className={isHypothetical ? 'hypothetical-sentence' : undefined}
                title={
                  isHypothetical
                    ? 'This inference extrapolates beyond documented positions.'
                    : undefined
                }
              >
                {sentence}
                {i < sentences.length - 1 ? ' ' : ''}
              </span>
            )
          })}
          {isStreaming && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1.1em',
                backgroundColor: 'var(--gold)',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'dot-pulse 1s infinite',
              }}
            />
          )}
        </p>
      </div>

      {/* Reasoning trace */}
      {trace && !isStreaming && (
        <ReasoningTrace trace={trace} defaultExpanded={true} />
      )}

      {/* Decision audit */}
      {!isStreaming && response && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <DecisionAuditButton data={auditData} />
        </div>
      )}
    </div>
  )
}
