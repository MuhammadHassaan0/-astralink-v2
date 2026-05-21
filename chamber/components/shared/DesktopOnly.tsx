export default function DesktopOnly() {
  return (
    <div
      className="flex min-h-screen items-center justify-center md:hidden"
      style={{ backgroundColor: 'var(--ink)', padding: '2rem' }}
    >
      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1.1rem',
          color: 'var(--muted-light)',
          textAlign: 'center',
          maxWidth: '24rem',
          lineHeight: 1.8,
        }}
      >
        The Chamber is best experienced on a desktop. Please return on a larger
        screen.
      </p>
    </div>
  )
}
