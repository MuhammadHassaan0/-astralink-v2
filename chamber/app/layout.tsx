import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Mono } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Chamber — Five Minds, Still Reasoning',
  description:
    'A constrained reasoning engine built on five documented corpora. Every output is traceable to a real source.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: 'var(--surface)', color: 'var(--ink)' }}>
        {children}
      </body>
    </html>
  )
}
