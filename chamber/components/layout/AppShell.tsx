import Header from './Header'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
