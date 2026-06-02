import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import { Eye, Clock, Calendar, User } from 'lucide-react'
import { formatDuration, formatDate, formatNumber } from '@/lib/utils'
import type { VideoInfo } from '@/types'

interface MetaItem {
  Icon: LucideIcon
  label: string
}

interface VideoCardProps {
  videoInfo: VideoInfo
}

export function VideoCard({ videoInfo }: VideoCardProps) {
  const meta: MetaItem[] = (
    [
      videoInfo.author       ? { Icon: User,     label: videoInfo.author }                    : null,
      videoInfo.viewCount > 0 ? { Icon: Eye,     label: formatNumber(videoInfo.viewCount) }   : null,
      videoInfo.duration > 0  ? { Icon: Clock,   label: formatDuration(videoInfo.duration) }  : null,
      videoInfo.uploadDate   ? { Icon: Calendar, label: formatDate(videoInfo.uploadDate) }     : null,
    ] as (MetaItem | null)[]
  ).filter((x): x is MetaItem => x !== null)

  return (
    <div className="flex gap-4 p-4 rounded-xl bg-surface border border-border">
      {videoInfo.thumbnail && (
        <div className="relative shrink-0 w-36 sm:w-44 rounded-lg overflow-hidden bg-surface-raised aspect-video">
          <Image
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="flex flex-col justify-center gap-2 min-w-0">
        <h2 className="font-semibold text-foreground leading-snug line-clamp-2 text-sm sm:text-base">
          {videoInfo.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {meta.map(({ Icon, label }) => (
            <span key={label} className="flex items-center gap-1 text-xs text-muted font-mono">
              <Icon className="h-3 w-3 shrink-0" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
