import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="font-mono text-7xl font-bold text-border select-none">404</p>
        <p className="text-muted text-sm">This page doesn't exist.</p>
        <Link
          href="/"
          className="inline-block text-sm text-accent hover:underline underline-offset-4 font-mono"
        >
          ← Back to SCRIBE
        </Link>
      </div>
    </div>
  )
}
