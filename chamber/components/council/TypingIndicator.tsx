export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.25rem 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`dot-${i + 1}` as 'dot-1' | 'dot-2' | 'dot-3'}
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'var(--gold)',
          }}
        />
      ))}
    </div>
  )
}
