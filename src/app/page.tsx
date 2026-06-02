'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, RotateCcw, FlaskConical } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { UrlBar } from '@/components/extractor/url-bar'
import { VideoCard } from '@/components/extractor/video-card'
import { TranscriptViewer } from '@/components/extractor/transcript-viewer'
import { SummaryCard } from '@/components/extractor/summary-card'
import { useExtractor } from '@/hooks/use-extractor'
import { useKeyboard } from '@/hooks/use-keyboard'
import { formatNumber } from '@/lib/utils'

export default function Home() {
  const { state, run, reset, loadDemo, urlInputRef } = useExtractor()
  useKeyboard({ urlInputRef, onReset: reset })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-14 max-w-4xl space-y-8">

        {/* Hero */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Every word,{' '}
            <span className="text-accent">captured.</span>
          </h1>
          <p className="text-muted text-sm">
            Paste any YouTube video, playlist, or channel link below.
          </p>
        </motion.div>

        {/* URL Bar */}
        <UrlBar
          onExtract={run}
          loading={state.status === 'loading'}
          inputRef={urlInputRef}
        />

        {/* Dynamic content */}
        <AnimatePresence mode="wait">

          {/* ── Loading ── */}
          {state.status === 'loading' && (
            <motion.div
              key="loading"
              className="flex items-center gap-2.5 text-sm text-muted font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              {state.message}
            </motion.div>
          )}

          {/* ── Error ── */}
          {state.status === 'error' && (
            <motion.div
              key="error"
              className="flex items-start justify-between gap-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-start gap-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{state.message}</span>
              </div>
              <button
                onClick={reset}
                className="shrink-0 flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors font-mono"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </motion.div>
          )}

          {/* ── Success: Video ── */}
          {state.status === 'success' && state.result.contentType === 'video' && (
            <motion.div
              key="video"
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <VideoCard videoInfo={state.result.videoInfo} />
              <SummaryCard sentences={state.result.summary} />
              <TranscriptViewer
                segments={state.result.transcript}
                videoInfo={state.result.videoInfo}
              />
            </motion.div>
          )}

          {/* ── Success: Playlist ── */}
          {state.status === 'success' && state.result.contentType === 'playlist' && (
            <motion.div
              key="playlist"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted font-mono">
                  <span className="text-foreground font-semibold">
                    {state.result.playlistInfo.title}
                  </span>
                  {' '}— {state.result.playlistInfo.videoCount} videos
                </p>
                <button
                  onClick={reset}
                  className="text-xs text-muted hover:text-foreground transition-colors font-mono flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> New
                </button>
              </div>
              <div className="grid gap-2">
                {state.result.playlistInfo.videos.map(video => (
                  <button
                    key={video.id}
                    onClick={() => run(`https://youtu.be/${video.id}`)}
                    className="
                      text-left p-3.5 rounded-lg
                      bg-surface border border-border
                      hover:border-accent/40 hover:bg-surface-raised
                      transition-all duration-150 group
                    "
                  >
                    <div className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors duration-150">
                      {video.title}
                    </div>
                    <div className="text-xs text-muted font-mono mt-0.5">{video.author}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Success: Channel ── */}
          {state.status === 'success' && state.result.contentType === 'channel' && (
            <motion.div
              key="channel"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted font-mono">
                  Recent videos from{' '}
                  <span className="text-foreground font-semibold">
                    {state.result.channelInfo.name}
                  </span>
                </p>
                <button
                  onClick={reset}
                  className="text-xs text-muted hover:text-foreground transition-colors font-mono flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> New
                </button>
              </div>
              <div className="grid gap-2">
                {state.result.channelInfo.videos.map(video => (
                  <button
                    key={video.id}
                    onClick={() => run(`https://youtu.be/${video.id}`)}
                    className="
                      text-left p-3.5 rounded-lg
                      bg-surface border border-border
                      hover:border-accent/40 hover:bg-surface-raised
                      transition-all duration-150 group
                    "
                  >
                    <div className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors duration-150">
                      {video.title}
                    </div>
                    <div className="text-xs text-muted font-mono mt-0.5">
                      {video.author}
                      {video.viewCount > 0 && ` · ${formatNumber(video.viewCount)} views`}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Idle ── */}
          {state.status === 'idle' && (
            <motion.div
              key="idle"
              className="flex flex-col items-center gap-5 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted font-mono">
                <span>Videos · Playlists · Channels</span>
                <span className="text-border">·</span>
                <span>TXT · SRT · MD · JSON</span>
                <span className="text-border">·</span>
                <span>No API key</span>
                <span className="text-border">·</span>
                <span>⌘K to focus</span>
              </div>

              <button
                onClick={loadDemo}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  text-xs text-muted font-mono
                  border border-border hover:border-border-hover hover:text-foreground
                  transition-all duration-150
                "
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Try demo
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}
