'use client'

import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, Link2 } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { copyTimestampLink } from '@/lib/export'
import type { TranscriptSegment, VideoInfo } from '@/types'

function highlight(text: string, query: string): ReactNode {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-accent/25 text-foreground rounded-sm px-0.5 not-italic">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

interface SegmentProps {
  segment: TranscriptSegment
  videoInfo: VideoInfo
  searchQuery: string
  index: number
}

export function Segment({ segment, videoInfo, searchQuery, index }: SegmentProps) {
  const [copied, setCopied] = useState(false)

  async function handleTimestampClick() {
    await copyTimestampLink(videoInfo.id, segment.start)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <motion.div
      className="group flex items-start gap-4 py-3 px-2 -mx-2 rounded-lg hover:bg-surface-raised transition-colors duration-100 cursor-default"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.015, 0.4) }}
    >
      <button
        onClick={handleTimestampClick}
        title="Copy timestamp link"
        className="
          shrink-0 mt-0.5 w-14 text-left
          font-mono text-xs text-muted
          hover:text-accent transition-colors duration-150
          flex items-center gap-1
        "
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Link2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 mr-0.5" />
        )}
        <span>{formatDuration(segment.start)}</span>
      </button>

      <p className="text-sm text-foreground leading-relaxed flex-1 font-mono">
        {highlight(segment.text, searchQuery)}
      </p>
    </motion.div>
  )
}
