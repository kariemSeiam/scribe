'use client'

import type { FC } from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, ChevronDown, FileText, Clapperboard, Hash, Braces } from 'lucide-react'
import { exportTranscript } from '@/lib/export'
import type { TranscriptSegment, VideoInfo, ExportFormat } from '@/types'

interface FormatOption {
  id: ExportFormat
  label: string
  ext: string
  Icon: FC<{ className?: string }>
}

const FORMATS: FormatOption[] = [
  { id: 'txt',  label: 'Plain Text', ext: '.txt',  Icon: FileText },
  { id: 'srt',  label: 'Subtitles',  ext: '.srt',  Icon: Clapperboard },
  { id: 'md',   label: 'Markdown',   ext: '.md',   Icon: Hash },
  { id: 'json', label: 'JSON',       ext: '.json', Icon: Braces },
]

interface ExportMenuProps {
  segments: TranscriptSegment[]
  videoInfo: VideoInfo
}

export function ExportMenu({ segments, videoInfo }: ExportMenuProps) {
  const [open, setOpen] = useState(false)

  function handle(format: ExportFormat) {
    exportTranscript(segments, videoInfo, format)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="
          h-10 px-3.5 rounded-lg flex items-center gap-1.5
          bg-surface border border-border text-sm text-foreground
          hover:border-border-hover transition-colors duration-150
          focus:outline-none focus:ring-1 focus:ring-accent/30
        "
      >
        <Download className="h-3.5 w-3.5 text-muted" />
        <span>Export</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              className="
                absolute right-0 top-12 z-20
                w-52 rounded-xl overflow-hidden
                bg-surface border border-border
                shadow-2xl shadow-black/30
              "
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.13 }}
            >
              {FORMATS.map(({ id, label, ext, Icon }) => (
                <button
                  key={id}
                  onClick={() => handle(id)}
                  className="
                    w-full flex items-center gap-3 px-4 py-2.5 text-left
                    text-sm text-foreground
                    hover:bg-surface-raised transition-colors duration-100
                  "
                >
                  <Icon className="h-3.5 w-3.5 text-muted shrink-0" />
                  <span className="flex-1">{label}</span>
                  <span className="font-mono text-xs text-muted">{ext}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
