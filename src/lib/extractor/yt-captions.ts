import type { TranscriptSegment } from '@/types'

// Multiple CORS proxies — raced in parallel so the fastest wins.
// Order signals priority for tie-breaking but parallel racing picks the first success.
const CORS_PROXIES: ReadonlyArray<(url: string) => string> = [
  url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://thingproxy.freeboard.io/fetch/${url}`,
  url => `https://yacdn.org/proxy/${url}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${url}`,
  url => `https://corsproxy.org/?${encodeURIComponent(url)}`,
]

const TIMEOUT = 12_000

// Deduplication cache — prevents duplicate requests for the same videoId
const captionCache = new Map<string, Promise<TranscriptSegment[]>>()
const CACHE_TTL = 10 * 60_000 // 10 minutes

function getCached(videoId: string): Promise<TranscriptSegment[]> | null {
  return captionCache.get(videoId) ?? null
}

function setCache(videoId: string, promise: Promise<TranscriptSegment[]>): void {
  captionCache.set(videoId, promise)
  setTimeout(() => captionCache.delete(videoId), CACHE_TTL)
}

interface YTJson3Event {
  tStartMs: number
  dDurationMs?: number
  segs?: Array<{ utf8: string }>
}

interface YTJson3 {
  events: YTJson3Event[]
}

function timedFetch(url: string): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), TIMEOUT)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id))
}

function parseJson3(data: YTJson3): TranscriptSegment[] {
  return (data.events ?? [])
    .filter(e => e.segs?.length)
    .map(e => ({
      text: e.segs!.map(s => s.utf8).join('').replace(/\n/g, ' ').trim(),
      start: e.tStartMs / 1000,
      duration: (e.dDurationMs ?? 3000) / 1000,
    }))
    .filter(s => s.text.length > 0)
}

// Race all CORS proxies for one YouTube caption URL.
// Returns the first successful result, or [] if all fail.
function raceProxies(ytUrl: string): Promise<TranscriptSegment[]> {
  return new Promise(resolve => {
    let done = false
    let settled = 0
    const total = CORS_PROXIES.length

    if (total === 0) {
      resolve([])
      return
    }

    CORS_PROXIES.forEach(makeUrl => {
      timedFetch(makeUrl(ytUrl))
        .then(async res => {
          if (done || !res.ok) return
          const data: YTJson3 = await res.json().catch(() => null)
          if (!data?.events?.length) return
          const segs = parseJson3(data)
          if (segs.length > 0 && !done) {
            done = true
            resolve(segs)
          }
        })
        .catch(() => {})
        .finally(() => {
          if (++settled === total && !done) resolve([])
        })
    })
  })
}

export async function fetchYouTubeCaptions(videoId: string): Promise<TranscriptSegment[]> {
  // Check cache first — deduplicate concurrent requests for same videoId
  const cached = getCached(videoId)
  if (cached) return cached

  const fetchPromise = (async () => {
    // Try each caption URL in order. For each, race all CORS proxies simultaneously.
    const captionUrls = [
      // Manual English captions
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
      // Auto-generated English (most videos have this even without manual captions)
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3&kind=asr`,
      // Auto-translated to English (catches foreign-language videos)
      `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3&tlang=en`,
    ]

    for (const url of captionUrls) {
      const segs = await raceProxies(url)
      if (segs.length > 0) return segs
    }

    return []
  })()

  setCache(videoId, fetchPromise)
  return fetchPromise
}
