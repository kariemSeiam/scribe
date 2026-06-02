'use client'

import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import { Search } from 'lucide-react'
import { Segment } from './segment'
import { StatsBar } from './stats-bar'
import { ExportMenu } from './export-menu'
import type { TranscriptSegment, VideoInfo } from '@/types'

interface TranscriptViewerProps {
  segments: TranscriptSegment[]
  videoInfo: VideoInfo
}

export function TranscriptViewer({ segments, videoInfo }: TranscriptViewerProps) {
  const [query, setQuery] = useState('')

  const fuse = useMemo(
    () =>
      new Fuse(segments, {
        keys: ['text'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [segments]
  )

  const visible = useMemo(() => {
    if (!query.trim()) return segments
    return fuse.search(query).map(r => r.item)
  }, [query, segments, fuse])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search transcript…"
            className="
              w-full h-10 pl-9 pr-4 rounded-lg
              bg-surface border border-border
              text-sm text-foreground placeholder:text-muted
              font-mono outline-none
              transition-all duration-200
              focus:border-accent focus:glow-accent
              hover:border-border-hover
            "
          />
        </div>
        <ExportMenu segments={segments} videoInfo={videoInfo} />
      </div>

      <StatsBar segments={segments} visible={visible} />

      {/* Segments */}
      <div className="divide-y divide-border/50">
        {visible.length === 0 ? (
          <p className="py-10 text-center text-muted text-sm font-mono">
            No segments match &ldquo;{query}&rdquo;
          </p>
        ) : (
          visible.map((seg, i) => (
            <Segment
              key={`${seg.start}-${i}`}
              segment={seg}
              videoInfo={videoInfo}
              searchQuery={query}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  )
}
