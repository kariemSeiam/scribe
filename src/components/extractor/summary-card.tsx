import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface SummaryCardProps {
  sentences: string[]
}

export function SummaryCard({ sentences }: SummaryCardProps) {
  if (sentences.length === 0) return null

  return (
    <motion.div
      className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
    >
      <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest">
        <Sparkles className="h-3.5 w-3.5" />
        Key Points
      </div>
      <ul className="space-y-2">
        {sentences.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
            <span className="text-accent/60 font-mono shrink-0 mt-0.5 text-xs">→</span>
            {s}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
