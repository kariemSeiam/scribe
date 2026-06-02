'use client'

import { useReducer, useRef, useCallback } from 'react'
import { extract } from '@/lib/extractor'
import { summarize } from '@/lib/summarize'
import { demoVideoInfo, demoTranscript } from '@/lib/demo-data'
import type { ExtractorState, ExtractorAction, ExtractionResult } from '@/types'

function reducer(state: ExtractorState, action: ExtractorAction): ExtractorState {
  switch (action.type) {
    case 'START':
      return { status: 'loading', message: 'Initializing…' }
    case 'PROGRESS':
      return { status: 'loading', message: action.message }
    case 'SUCCESS':
    case 'DEMO':
      return { status: 'success', result: action.result }
    case 'ERROR':
      return { status: 'error', message: action.message }
    case 'RESET':
      return { status: 'idle' }
    default:
      return state
  }
}

export function useExtractor() {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' })
  const urlInputRef = useRef<HTMLInputElement>(null)

  const run = useCallback(async (url: string) => {
    if (!url.trim()) return
    dispatch({ type: 'START' })

    try {
      const result = await extract(url.trim(), msg => {
        dispatch({ type: 'PROGRESS', message: msg })
      })
      dispatch({ type: 'SUCCESS', result })
    } catch (err) {
      dispatch({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
      })
    }
  }, [])

  const loadDemo = useCallback(() => {
    dispatch({
      type: 'DEMO',
      result: {
        contentType: 'video',
        videoInfo: demoVideoInfo,
        transcript: demoTranscript,
        summary: summarize(demoTranscript),
      } satisfies ExtractionResult,
    })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
    setTimeout(() => urlInputRef.current?.focus(), 50)
  }, [])

  return { state, run, reset, loadDemo, urlInputRef }
}
