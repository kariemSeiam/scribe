import { extractVideoId, extractPlaylistId, extractChannelId } from '@/lib/utils'
import { fetchVideoData, fetchPlaylistData, fetchChannelData } from './invidious'
import { fetchYouTubeCaptions } from './yt-captions'
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
    onProgress('Finding a working Invidious instance…')

    let videoInfo: VideoInfo
    let transcript = await Promise.resolve([]).then(() => []) as Awaited<ReturnType<typeof fetchYouTubeCaptions>>
    let invidiousFailed = false

    try {
      const result = await fetchVideoData(videoId)
      videoInfo = result.videoInfo
      transcript = result.transcript
    } catch {
      invidiousFailed = true
      // Construct minimal videoInfo — thumbnail is always resolvable from YouTube CDN
      videoInfo = {
        id: videoId,
        title: 'YouTube Video',
        author: '',
        authorId: '',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 0,
        uploadDate: '',
        viewCount: 0,
        description: '',
      }
    }

    if (transcript.length === 0) {
      onProgress(
        invidiousFailed
          ? 'Invidious unavailable — trying YouTube directly…'
          : 'No captions via Invidious — trying YouTube directly…'
      )
      transcript = await fetchYouTubeCaptions(videoId)
    }

    if (transcript.length === 0) {
      throw new Error(
        invidiousFailed
          ? 'Could not reach any extraction source. Check your connection or try again later.'
          : 'No captions found. This video may not have subtitles enabled.'
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
