import type { TranscriptSegment } from '@/types'

// Free CORS proxies — tried in order, first success wins
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
] as const

const TIMEOUT = 12_000

// Shape of YouTube's json3 caption format
interface YTJson3Event {
  tStartMs: number
  dDurationMs?: number
  segs?: Array<{ utf8: string }>
}

interface YTJson3 {
  events: YTJson3Event[]
}

async function timedFetch(url: string): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), TIMEOUT)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id))
}

export async function fetchYouTubeCaptions(videoId: string): Promise<TranscriptSegment[]> {
  const ytUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`

  for (const makeUrl of CORS_PROXIES) {
    try {
      const res = await timedFetch(makeUrl(ytUrl))
      if (!res.ok) continue

      const data: YTJson3 = await res.json()
      if (!data.events?.length) continue

      return data.events
        .filter(e => e.segs && e.segs.length > 0)
        .map(e => ({
          text: e.segs!.map(s => s.utf8).join('').replace(/\n/g, ' ').trim(),
          start: e.tStartMs / 1000,
          duration: (e.dDurationMs ?? 3000) / 1000,
        }))
        .filter(s => s.text.length > 0)
    } catch {
      continue
    }
  }

  return []
}
