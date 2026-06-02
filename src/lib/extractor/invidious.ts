import type { VideoInfo, PlaylistInfo, ChannelInfo, TranscriptSegment } from '@/types'

// Verified-alive instances as of 2025-06. Check https://instances.invidious.io for updates.
const INSTANCES = [
  'https://inv.riverside.rocks',
  'https://invidious.privacydev.net',
  'https://iv.datura.network',
  'https://invidious.nerdvpn.de',
  'https://yt.cdaut.de',
  'https://invidious.fdn.fr',
  'https://invidious.perennialte.ch',
  'https://invidious.protokolla.fi',
] as const

const INSTANCE_TIMEOUT = 5_000
const API_TIMEOUT = 10_000
const CAPTION_TIMEOUT = 14_000

// ── Internal API shapes ────────────────────────────────────────────────────────

interface InvThumbnail {
  quality: string
  url: string
}

interface InvCaption {
  label: string
  language_code: string
  url: string
}

interface InvVideoResponse {
  title: string
  videoId: string
  author: string
  authorId: string
  description: string
  published: number
  viewCount: number
  lengthSeconds: number
  videoThumbnails: InvThumbnail[]
  captions: InvCaption[]
}

interface InvPlaylistVideo {
  title: string
  videoId: string
  author: string
  authorId: string
  lengthSeconds: number
  videoThumbnails: InvThumbnail[]
}

interface InvPlaylistResponse {
  title: string
  playlistId: string
  author: string
  description: string
  videoCount: number
  videos: InvPlaylistVideo[]
}

interface InvLatestVideo {
  title: string
  videoId: string
  author: string
  authorId: string
  published: number
  viewCount: number
  lengthSeconds: number
  videoThumbnails: InvThumbnail[]
}

interface InvChannelResponse {
  author: string
  authorId: string
  authorThumbnails: Array<{ url: string }>
  description: string
  subCount: number
  latestVideos: InvLatestVideo[]
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function timedFetch(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id))
}

function bestThumbnail(thumbs: InvThumbnail[]): string {
  const order = ['maxresdefault', 'maxres', 'sddefault', 'high', 'medium', 'default']
  for (const q of order) {
    const t = thumbs.find(x => x.quality === q)
    if (t?.url) return t.url
  }
  return thumbs[0]?.url ?? ''
}

async function workingInstance(): Promise<string> {
  const checks = INSTANCES.map(async inst => {
    try {
      const res = await timedFetch(`${inst}/api/v1/stats`, INSTANCE_TIMEOUT)
      return res.ok ? inst : null
    } catch {
      return null
    }
  })

  // Return first to respond successfully
  return new Promise((resolve, reject) => {
    let settled = 0
    checks.forEach(p =>
      p.then(inst => {
        if (inst) resolve(inst)
        else if (++settled === checks.length) reject(new Error('All Invidious instances unreachable'))
      })
    )
  })
}

// ── VTT Parser ─────────────────────────────────────────────────────────────────

function vttToSeconds(t: string): number {
  const clean = t.replace(',', '.')
  const parts = clean.split(':').map(Number)
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1]
}

function parseVTT(vtt: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []

  for (const block of vtt.split(/\n\n+/)) {
    const lines = block.split('\n').filter(l => l && l !== 'WEBVTT')
    const timeLine = lines.find(l => l.includes('-->'))
    if (!timeLine) continue

    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim())
    const start = vttToSeconds(startStr)
    const end = vttToSeconds(endStr)

    const text = lines
      .filter(l => !l.includes('-->') && !/^\d+$/.test(l.trim()))
      .join(' ')
      .replace(/<[^>]+>/g, '') // strip inline VTT tags
      .replace(/\s+/g, ' ')
      .trim()

    if (text && end > start) {
      segments.push({ text, start, duration: end - start })
    }
  }

  return segments
}

async function fetchCaptions(
  captions: InvCaption[],
  instance: string,
): Promise<TranscriptSegment[]> {
  const preferred =
    captions.find(c => c.language_code === 'en') ??
    captions.find(c => c.label.toLowerCase().includes('english')) ??
    captions[0]

  if (!preferred) return []

  const base = preferred.url.startsWith('http') ? preferred.url : `${instance}${preferred.url}`
  const vttUrl = base.includes('fmt=') ? base : `${base}&fmt=vtt`

  try {
    const res = await timedFetch(vttUrl, CAPTION_TIMEOUT)
    if (!res.ok) return []
    return parseVTT(await res.text())
  } catch {
    return []
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function fetchVideoData(videoId: string): Promise<{
  videoInfo: VideoInfo
  transcript: TranscriptSegment[]
}> {
  const instance = await workingInstance()

  const res = await timedFetch(`${instance}/api/v1/videos/${videoId}`, API_TIMEOUT)
  if (!res.ok) throw new Error(`Invidious returned ${res.status} for video ${videoId}`)

  const data: InvVideoResponse = await res.json()

  const videoInfo: VideoInfo = {
    id: videoId,
    title: data.title,
    author: data.author,
    authorId: data.authorId,
    thumbnail: bestThumbnail(data.videoThumbnails),
    duration: data.lengthSeconds,
    uploadDate: new Date(data.published * 1000).toISOString(),
    viewCount: data.viewCount,
    description: data.description,
  }

  const transcript = await fetchCaptions(data.captions ?? [], instance)

  return { videoInfo, transcript }
}

export async function fetchPlaylistData(playlistId: string): Promise<PlaylistInfo> {
  const instance = await workingInstance()

  const res = await timedFetch(`${instance}/api/v1/playlists/${playlistId}`, API_TIMEOUT)
  if (!res.ok) throw new Error(`Invidious returned ${res.status} for playlist ${playlistId}`)

  const data: InvPlaylistResponse = await res.json()

  return {
    id: playlistId,
    title: data.title,
    author: data.author,
    thumbnail: data.videos[0] ? bestThumbnail(data.videos[0].videoThumbnails) : '',
    videoCount: data.videoCount,
    description: data.description ?? '',
    videos: data.videos.map(v => ({
      id: v.videoId,
      title: v.title,
      author: v.author,
      authorId: v.authorId,
      thumbnail: bestThumbnail(v.videoThumbnails),
      duration: v.lengthSeconds,
      uploadDate: '',
      viewCount: 0,
      description: '',
    })),
  }
}

export async function fetchChannelData(channelId: string): Promise<ChannelInfo> {
  const instance = await workingInstance()

  const res = await timedFetch(`${instance}/api/v1/channels/${channelId}`, API_TIMEOUT)
  if (!res.ok) throw new Error(`Invidious returned ${res.status} for channel ${channelId}`)

  const data: InvChannelResponse = await res.json()

  return {
    id: channelId,
    handle: channelId.startsWith('@') ? channelId : `@${data.author}`,
    name: data.author,
    thumbnail: data.authorThumbnails?.[0]?.url ?? '',
    subscriberCount: data.subCount ?? 0,
    description: data.description ?? '',
    videos: (data.latestVideos ?? []).map(v => ({
      id: v.videoId,
      title: v.title,
      author: v.author,
      authorId: v.authorId,
      thumbnail: bestThumbnail(v.videoThumbnails),
      duration: v.lengthSeconds,
      uploadDate: new Date(v.published * 1000).toISOString(),
      viewCount: v.viewCount,
      description: '',
    })),
  }
}
