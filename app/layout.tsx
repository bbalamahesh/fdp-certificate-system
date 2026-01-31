import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
export const metadata: Metadata = {
  title: 'FDP Registration - SRM IST',
  description: 'Registration for Mastering Data Analysis Using R Studio FDP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Toaster richColors position="top-right" />
      <body>{children}</body>
    </html>
  )
}
