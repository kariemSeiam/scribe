import type { VideoInfo } from '@/types'

interface OEmbedResponse {
  title: string
  author_name: string
  author_url: string
  thumbnail_url: string
}

// YouTube oEmbed is a public standard endpoint with CORS (reflects requesting origin).
// Returns limited metadata: title, author, thumbnail. No duration, views, or description.
export async function fetchOEmbedMetadata(videoId: string): Promise<VideoInfo> {
  const base: VideoInfo = {
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

  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}&format=json`
    const res = await fetch(url)
    if (!res.ok) return base

    const data: OEmbedResponse = await res.json()

    // Extract @handle or channel path from author_url
    const handleMatch = data.author_url?.match(/youtube\.com\/(@[^\/]+)/)
    const authorId = handleMatch?.[1] ?? ''

    // Prefer higher-quality YouTube CDN thumbnail over oEmbed's 480px version
    return {
      ...base,
      title: data.title || base.title,
      author: data.author_name || base.author,
      authorId,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    }
  } catch {
    return base
  }
}
