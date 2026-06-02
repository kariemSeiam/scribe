export type ContentType = 'video' | 'playlist' | 'channel'

export type ExportFormat = 'txt' | 'srt' | 'md' | 'json'

export interface TranscriptSegment {
  text: string
  start: number    // seconds from video start
  duration: number // seconds
}

export interface VideoInfo {
  id: string
  title: string
  author: string
  authorId: string
  thumbnail: string
  duration: number    // seconds
  uploadDate: string  // ISO string or empty
  viewCount: number
  description: string
}

export interface PlaylistInfo {
  id: string
  title: string
  author: string
  thumbnail: string
  videoCount: number
  description: string
  videos: VideoInfo[]
}

export interface ChannelInfo {
  id: string
  handle: string
  name: string
  thumbnail: string
  subscriberCount: number
  description: string
  videos: VideoInfo[]
}

export type ExtractionResult =
  | { contentType: 'video'; videoInfo: VideoInfo; transcript: TranscriptSegment[]; summary: string[] }
  | { contentType: 'playlist'; playlistInfo: PlaylistInfo }
  | { contentType: 'channel'; channelInfo: ChannelInfo }

export type ExtractorState =
  | { status: 'idle' }
  | { status: 'loading'; message: string }
  | { status: 'success'; result: ExtractionResult }
  | { status: 'error'; message: string }

export type ExtractorAction =
  | { type: 'START' }
  | { type: 'PROGRESS'; message: string }
  | { type: 'SUCCESS'; result: ExtractionResult }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }
  | { type: 'DEMO'; result: ExtractionResult }
