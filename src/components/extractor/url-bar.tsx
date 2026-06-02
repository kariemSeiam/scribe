'use client'

import { type RefObject, type FormEvent, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, X } from 'lucide-react'

interface UrlBarProps {
  onExtract: (url: string) => void
  loading: boolean
  inputRef?: RefObject<HTMLInputElement>
}

export function UrlBar({ onExtract, loading, inputRef }: UrlBarProps) {
  const localRef = useRef<HTMLInputElement>(null)
  const ref = inputRef ?? localRef
  const [hasValue, setHasValue] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const val = ref.current?.value.trim()
    if (val) onExtract(val)
  }

  function clear() {
    if (!ref.current) return
    ref.current.value = ''
    setHasValue(false)
    ref.current.focus()
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="relative flex items-center gap-2.5 w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <div className="relative flex-1 group">
        <input
          ref={ref}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="youtube.com/watch?v=… or youtu.be/…"
          disabled={loading}
          onChange={e => setHasValue(e.target.value.length > 0)}
          className="
            w-full h-14 px-5 pr-10 rounded-xl
            bg-surface border border-border
            text-foreground placeholder:text-muted
            font-mono text-sm
            outline-none
            transition-all duration-200
            focus:border-accent focus:glow-accent
            group-hover:border-border-hover
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
        {hasValue && !loading && (
          <button
            type="button"
            onClick={clear}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors duration-150 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileTap={{ scale: 0.97 }}
        className="
          h-14 px-6 rounded-xl shrink-0
          bg-accent text-white font-semibold text-sm
          flex items-center gap-2
          transition-colors duration-150
          hover:bg-accent-hover
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-accent/40
        "
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Extract
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </motion.button>
    </motion.form>
  )
}
