import { extractVideoId, extractPlaylistId, extractChannelId } from '@/lib/utils'
import { fetchVideoData, fetchPlaylistData, fetchChannelData } from './invidious'
import { fetchYouTubeCaptions } from './yt-captions'
import { fetchOEmbedMetadata } from './oembed'
import { summarize } from '@/lib/summarize'
import type { ExtractionResult, VideoInfo } from '@/types'

type Progress = (message: string) => void

// Request deduplication — prevents duplicate extractions for the same URL
const extractionCache = new Map<string, Promise<ExtractionResult>>()
const CACHE_TTL = 5 * 60_000 // 5 minutes

function normalizeUrl(url: string): string {
  // Strip everything after videoId/playlistId/channelId to deduplicate variants
  return url.split('&')[0].split('#')[0]
}

function getCachedExtraction(url: string): Promise<ExtractionResult> | null {
  const key = normalizeUrl(url)
  return extractionCache.get(key) ?? null
}

function setCachedExtraction(url: string, promise: Promise<ExtractionResult>): void {
  const key = normalizeUrl(url)
  extractionCache.set(key, promise)
  setTimeout(() => extractionCache.delete(key), CACHE_TTL)
}

export async function extract(url: string, onProgress: Progress): Promise<ExtractionResult> {
  // Check cache first — deduplicate concurrent/retry requests
  const cached = getCachedExtraction(url)
  if (cached) {
    onProgress('Using cached result…')
    return cached
  }

  const extractionPromise = performExtraction(url, onProgress)
  setCachedExtraction(url, extractionPromise)
  return extractionPromise
}

async function performExtraction(url: string, onProgress: Progress): Promise<ExtractionResult> {
  const videoId = extractVideoId(url)
  const playlistId = extractPlaylistId(url)
  const channelId = extractChannelId(url)

  if (!videoId && !playlistId && !channelId) {
    throw new Error(
      'Not a valid YouTube URL. Paste a video, playlist, or channel link.'
    )
  }

  // ── Video ──────────────────────────────────────────────────────────────────
  if (videoId) {
    onProgress('Looking for a working Invidious instance…')

    let videoInfo: VideoInfo
    let transcript: ReturnType<typeof fetchYouTubeCaptions> extends Promise<infer T> ? T : never = []

    // Primary: Invidious — rich metadata + captions in one request
    try {
      const result = await fetchVideoData(videoId)
      videoInfo = result.videoInfo
      transcript = result.transcript
    } catch {
      // Invidious unreachable — fetch basic metadata via YouTube oEmbed (always works)
      onProgress('Fetching video info from YouTube…')
      videoInfo = await fetchOEmbedMetadata(videoId)
    }

    // Caption fallback: YouTube timedtext via CORS proxies
    if (transcript.length === 0) {
      onProgress('Fetching captions from YouTube…')
      transcript = await fetchYouTubeCaptions(videoId)
    }

    if (transcript.length === 0) {
      throw new Error(
        'No captions found. This video may not have subtitles, or caption access is temporarily restricted.',
      )
    }

    onProgress('Summarizing…')
    const summary = summarize(transcript)

    return { contentType: 'video', videoInfo, transcript, summary }
  }

  // ── Playlist ───────────────────────────────────────────────────────────────
  if (playlistId) {
    onProgress('Fetching playlist…')
    const playlistInfo = await fetchPlaylistData(playlistId)
    return { contentType: 'playlist', playlistInfo }
  }

  // ── Channel ────────────────────────────────────────────────────────────────
  onProgress('Fetching channel…')
  const channelInfo = await fetchChannelData(channelId!)
  return { contentType: 'channel', channelInfo }
}
