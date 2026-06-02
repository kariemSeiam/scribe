import type { TranscriptSegment, VideoInfo, ExportFormat } from '@/types'

// ── Formatters ─────────────────────────────────────────────────────────────────

function toSRTTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.round((sec % 1) * 1000)
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':') + ',' + String(ms).padStart(3, '0')
}

function toTimestamp(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function safeName(title: string): string {
  return title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 80)
}

// ── Build content strings ──────────────────────────────────────────────────────

function buildTxt(segments: TranscriptSegment[]): string {
  return segments.map(s => s.text).join('\n\n')
}

function buildSRT(segments: TranscriptSegment[]): string {
  return segments
    .map((s, i) =>
      [
        i + 1,
        `${toSRTTime(s.start)} --> ${toSRTTime(s.start + s.duration)}`,
        s.text,
      ].join('\n')
    )
    .join('\n\n')
}

function buildMD(segments: TranscriptSegment[], video: VideoInfo): string {
  // Group by minute
  const byMinute: Record<number, TranscriptSegment[]> = {}
  for (const seg of segments) {
    const min = Math.floor(seg.start / 60)
    ;(byMinute[min] ??= []).push(seg)
  }

  const sections = Object.entries(byMinute).map(([min, segs]) =>
    `## [${toTimestamp(Number(min) * 60)}]\n\n${segs.map(s => s.text).join(' ')}`
  )

  return `# ${video.title}\n\nBy ${video.author}\n\n---\n\n${sections.join('\n\n')}`
}

function buildJSON(segments: TranscriptSegment[], video: VideoInfo): string {
  return JSON.stringify(
    {
      video: {
        id: video.id,
        title: video.title,
        author: video.author,
        duration: video.duration,
        uploadDate: video.uploadDate,
        viewCount: video.viewCount,
      },
      transcript: segments,
    },
    null,
    2
  )
}

// ── Trigger browser download ───────────────────────────────────────────────────

function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function exportTranscript(
  segments: TranscriptSegment[],
  video: VideoInfo,
  format: ExportFormat
): void {
  const name = safeName(video.title)

  switch (format) {
    case 'txt':
      return download(buildTxt(segments), `${name}.txt`, 'text/plain')
    case 'srt':
      return download(buildSRT(segments), `${name}.srt`, 'text/srt')
    case 'md':
      return download(buildMD(segments, video), `${name}.md`, 'text/markdown')
    case 'json':
      return download(buildJSON(segments, video), `${name}.json`, 'application/json')
  }
}

export function copyTranscript(segments: TranscriptSegment[]): Promise<void> {
  return navigator.clipboard.writeText(buildTxt(segments))
}

export function copyTimestampLink(videoId: string, startSeconds: number): Promise<void> {
  const url = `https://youtu.be/${videoId}?t=${Math.floor(startSeconds)}`
  return navigator.clipboard.writeText(url)
}
