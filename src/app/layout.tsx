import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SCRIBE — Every word, captured.',
  description:
    'Extract transcripts from any YouTube video, playlist, or channel. Free. No API key. No login. Export as TXT, SRT, Markdown, or JSON.',
  keywords: ['youtube', 'transcript', 'captions', 'extractor', 'subtitles', 'scribe'],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'SCRIBE — Every word, captured.',
    description:
      'Extract transcripts from any YouTube video, playlist, or channel. Free. No API key.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark" storageKey="scribe-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
