import { wordCount, readingMinutes } from '@/lib/utils'
import type { TranscriptSegment } from '@/types'

interface StatsBarProps {
  segments: TranscriptSegment[]
  visible: TranscriptSegment[]
}

export function StatsBar({ segments, visible }: StatsBarProps) {
  const totalWords = segments.reduce((n, s) => n + wordCount(s.text), 0)
  const isFiltered = visible.length !== segments.length

  const items = [
    `${segments.length} segments`,
    `${totalWords.toLocaleString()} words`,
    `~${readingMinutes(totalWords)} min read`,
    isFiltered ? `${visible.length} matching` : null,
  ].filter(Boolean) as string[]

  return (
    <div className="flex items-center gap-2 text-xs text-muted font-mono flex-wrap">
      {items.map((item, i) => (
        <span key={item} className="flex items-center gap-2">
          {i > 0 && <span className="text-border">·</span>}
          <span className={item.includes('matching') ? 'text-accent' : ''}>{item}</span>
        </span>
      ))}
    </div>
  )
}
