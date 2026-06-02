import { extractVideoId, extractPlaylistId, extractChannelId } from '@/lib/utils'
import { fetchVideoData, fetchPlaylistData, fetchChannelData } from './invidious'
import { fetchYouTubeCaptions } from './yt-captions'
import { fetchOEmbedMetadata } from './oembed'
import { summarize } from '@/lib/summarize'
import type { ExtractionResult, VideoInfo } from '@/types'

type Progress = (message: string) => void

export async function extract(url: string, onProgress: Progress): Promise<ExtractionResult> {
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
