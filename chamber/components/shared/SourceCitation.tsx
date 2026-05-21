export default function SourceCitation({ citation }: { citation: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginTop: '1.25rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--border-light)',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: 'var(--gold)',
          flexShrink: 0,
          marginTop: '0.25em',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontWeight: 300,
          fontSize: '0.58rem',
          letterSpacing: '0.06em',
          color: 'var(--muted)',
          lineHeight: 1.6,
        }}
      >
        {citation}
      </span>
    </div>
  )
}
