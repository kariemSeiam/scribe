import type { VideoInfo, PlaylistInfo, ChannelInfo, TranscriptSegment } from '@/types'

// Static fallback — verified alive 2026-06. Dynamic discovery runs first in practice.
const STATIC_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://invidious.protokolla.fi',
  'https://inv.riverside.rocks',
  'https://invidious.privacydev.net',
  'https://iv.datura.network',
  'https://yt.cdaut.de',
  'https://invidious.fdn.fr',
  'https://invidious.perennialte.ch',
  'https://invidious.lunar.icu',
  'https://invidious.reallyaweso.me',
  'https://invidious.jing.rocks',
  'https://inv.tux.pizza',
] as const

const INSTANCE_TIMEOUT = 5_000
const API_TIMEOUT = 10_000
const CAPTION_TIMEOUT = 14_000
const DISCOVERY_TIMEOUT = 4_000
const CACHE_TTL = 10 * 60 * 1000

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

interface InstanceInfo {
  api: boolean
  type: string
  uri: string
  cors?: boolean
  monitor?: { uptime: number; down: boolean }
}

// ── Instance management ────────────────────────────────────────────────────────

let _cachedInstance: string | null = null
let _cacheExpiry = 0

function invalidateInstanceCache(): void {
  _cachedInstance = null
  _cacheExpiry = 0
}

function timedFetch(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id))
}

// Fetch a fresh ranked list from the public instances API, fall back to static list.
async function discoverInstances(): Promise<string[]> {
  try {
    const res = await timedFetch(
      'https://api.invidious.io/instances.json?sort_by=health',
      DISCOVERY_TIMEOUT,
    )
    if (!res.ok) return [...STATIC_INSTANCES]

    const raw: Array<[string, InstanceInfo]> = await res.json()
    const live = raw
      .filter(
        ([, info]) =>
          info.api &&
          info.type === 'https' &&
          info.cors !== false &&
          !info.monitor?.down &&
          (info.monitor?.uptime ?? 1) >= 0.8,
      )
      .map(([, info]) => info.uri.replace(/\/$/, ''))
      .filter(Boolean)
      .slice(0, 12)

    return live.length >= 2 ? live : [...STATIC_INSTANCES]
  } catch {
    return [...STATIC_INSTANCES]
  }
}

// Race all candidate instances; return the first to respond with HTTP 200.
async function raceInstances(instances: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = 0
    instances.forEach(inst => {
      timedFetch(`${inst}/api/v1/stats`, INSTANCE_TIMEOUT)
        .then(res => {
          if (res.ok) resolve(inst)
          else if (++settled === instances.length)
            reject(new Error('All Invidious instances unreachable'))
        })
        .catch(() => {
          if (++settled === instances.length)
            reject(new Error('All Invidious instances unreachable'))
        })
    })
  })
}

async function workingInstance(): Promise<string> {
  if (_cachedInstance && Date.now() < _cacheExpiry) return _cachedInstance
  const instances = await discoverInstances()
  const inst = await raceInstances(instances)
  _cachedInstance = inst
  _cacheExpiry = Date.now() + CACHE_TTL
  return inst
}

// ── Thumbnail helpers ──────────────────────────────────────────────────────────

// Always use YouTube CDN so we don't depend on Invidious instance hostnames.
function videoThumbnail(videoId: string, thumbs: InvThumbnail[]): string {
  const order = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default']
  for (const q of order) {
    if (thumbs.some(t => t.quality === q)) return `https://i.ytimg.com/vi/${videoId}/${q}.jpg`
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

// Channel thumbnails come from yt3.ggpht.com or as Invidious-relative paths.
function channelThumbnail(thumbs: Array<{ url: string }>, instance: string): string {
  const url = thumbs?.[0]?.url ?? ''
  if (!url) return ''
  if (url.startsWith('http')) return url
  // Relative /ggpht/... paths → YouTube CDN
  if (url.startsWith('/ggpht/')) return `https://yt3.ggpht.com${url.slice('/ggpht'.length)}`
  return `${instance}${url}`
}

// ── VTT parser ─────────────────────────────────────────────────────────────────

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
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (text && end > start) {
      segments.push({ text, start, duration: end - start })
    }
  }

  return deduplicateSegments(segments)
}

// Remove consecutive identical segments produced by YouTube's rolling-window VTT.
function deduplicateSegments(segs: TranscriptSegment[]): TranscriptSegment[] {
  return segs.filter((seg, i) => i === 0 || seg.text !== segs[i - 1].text)
}

// ── Caption fetching ───────────────────────────────────────────────────────────

async function tryFetchCaption(cap: InvCaption, instance: string): Promise<TranscriptSegment[]> {
  const base = cap.url.startsWith('http') ? cap.url : `${instance}${cap.url}`
  const vttUrl = base.includes('fmt=') ? base : `${base}&fmt=vtt`
  try {
    const res = await timedFetch(vttUrl, CAPTION_TIMEOUT)
    if (!res.ok) return []
    return parseVTT(await res.text())
  } catch {
    return []
  }
}

async function fetchCaptions(captions: InvCaption[], instance: string): Promise<TranscriptSegment[]> {
  if (!captions.length) return []

  const isAuto = (c: InvCaption) => c.label.toLowerCase().includes('auto')
  const isEnglish = (c: InvCaption) =>
    c.language_code === 'en' || c.label.toLowerCase().includes('english')

  // Priority: manual English → auto English → any manual → any available
  const preferred =
    captions.find(c => isEnglish(c) && !isAuto(c)) ??
    captions.find(c => isEnglish(c)) ??
    captions.find(c => !isAuto(c)) ??
    captions[0]

  const result = await tryFetchCaption(preferred, instance)
  if (result.length > 0) return result

  // Try remaining tracks as fallback
  for (const cap of captions) {
    if (cap === preferred) continue
    const r = await tryFetchCaption(cap, instance)
    if (r.length > 0) return r
  }

  return []
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function fetchVideoData(videoId: string): Promise<{
  videoInfo: VideoInfo
  transcript: TranscriptSegment[]
}> {
  let instance: string
  try {
    instance = await workingInstance()
  } catch (err) {
    throw err
  }

  const res = await timedFetch(`${instance}/api/v1/videos/${videoId}`, API_TIMEOUT)
  if (!res.ok) {
    invalidateInstanceCache()
    throw new Error(`Invidious returned ${res.status} for video ${videoId}`)
  }

  const data: InvVideoResponse = await res.json()

  const videoInfo: VideoInfo = {
    id: videoId,
    title: data.title,
    author: data.author,
    authorId: data.authorId,
    thumbnail: videoThumbnail(videoId, data.videoThumbnails ?? []),
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
  if (!res.ok) {
    invalidateInstanceCache()
    throw new Error(`Invidious returned ${res.status} for playlist ${playlistId}`)
  }

  const data: InvPlaylistResponse = await res.json()

  return {
    id: playlistId,
    title: data.title,
    author: data.author,
    thumbnail: data.videos[0]
      ? videoThumbnail(data.videos[0].videoId, data.videos[0].videoThumbnails)
      : '',
    videoCount: data.videoCount,
    description: data.description ?? '',
    videos: data.videos.map(v => ({
      id: v.videoId,
      title: v.title,
      author: v.author,
      authorId: v.authorId,
      thumbnail: videoThumbnail(v.videoId, v.videoThumbnails),
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
  if (!res.ok) {
    invalidateInstanceCache()
    throw new Error(`Invidious returned ${res.status} for channel ${channelId}`)
  }

  const data: InvChannelResponse = await res.json()

  return {
    id: channelId,
    handle: channelId.startsWith('@') ? channelId : `@${data.author}`,
    name: data.author,
    thumbnail: channelThumbnail(data.authorThumbnails ?? [], instance),
    subscriberCount: data.subCount ?? 0,
    description: data.description ?? '',
    videos: (data.latestVideos ?? []).map(v => ({
      id: v.videoId,
      title: v.title,
      author: v.author,
      authorId: v.authorId,
      thumbnail: videoThumbnail(v.videoId, v.videoThumbnails),
      duration: v.lengthSeconds,
      uploadDate: new Date(v.published * 1000).toISOString(),
      viewCount: v.viewCount,
      description: '',
    })),
  }
}
