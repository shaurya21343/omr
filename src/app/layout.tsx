import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// @ts-expect-error CSS imports are handled by Next.js.
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Digital OMR Sheet',
  description: 'Create and submit digital OMR sheets with history tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}