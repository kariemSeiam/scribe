'use client'

import { useEffect, type RefObject } from 'react'

interface UseKeyboardOptions {
  urlInputRef: RefObject<HTMLInputElement>
  onReset: () => void
}

export function useKeyboard({ urlInputRef, onReset }: UseKeyboardOptions): void {
  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      const mod = e.metaKey || e.ctrlKey

      // ⌘K / Ctrl+K — focus the URL bar
      if (mod && e.key === 'k') {
        e.preventDefault()
        urlInputRef.current?.focus()
        urlInputRef.current?.select()
      }

      // Escape — reset to idle (but not if focused in an input)
      if (e.key === 'Escape' && document.activeElement?.tagName !== 'INPUT') {
        onReset()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [urlInputRef, onReset])
}
