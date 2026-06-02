export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="container mx-auto px-4 max-w-4xl h-12 flex items-center justify-between">
        <span className="text-xs text-muted font-mono">
          SCRIBE — every word, captured.
        </span>
        <span className="text-xs text-muted font-mono">
          Powered by{' '}
          <a
            href="https://invidious.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors duration-150"
          >
            Invidious
          </a>
        </span>
      </div>
    </footer>
  )
}
