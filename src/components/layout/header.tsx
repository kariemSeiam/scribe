import { Mic2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border glass">
      <div className="container mx-auto px-4 max-w-4xl h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Mic2 className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <span className="font-bold tracking-tight text-foreground text-sm uppercase">
            Scribe
          </span>
          <span className="text-[10px] text-muted font-mono leading-none px-1.5 py-0.5 rounded bg-surface border border-border">
            v2
          </span>
        </div>

        <div className="flex items-center gap-3">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-border text-[11px] text-muted font-mono select-none">
            <span>⌘</span><span>K</span>
          </kbd>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
