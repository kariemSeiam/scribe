import type { TranscriptSegment } from '@/types'

const STOP = new Set([
  'a','an','the','is','it','in','on','at','to','for','of','and','or','but',
  'with','this','that','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'can','i','we','you','he','she','they','what','which','who','how','when',
  'where','why','there','here','so','if','as','by','from','up','about',
  'into','through','during','just','very','also','now','then','than','more',
  'its','our','my','your','their','im','ive','ill','id','dont','doesnt',
  'didnt','wont','cant','isnt','arent','wasnt','werent','lets','got','get',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w))
}

export function summarize(segments: TranscriptSegment[], maxSentences = 5): string[] {
  if (segments.length === 0) return []
  if (segments.length <= maxSentences) return segments.map(s => s.text)

  // Term frequency across the full transcript
  const tf: Record<string, number> = {}
  for (const seg of segments) {
    for (const w of tokenize(seg.text)) {
      tf[w] = (tf[w] ?? 0) + 1
    }
  }

  // Score each segment: mean TF of its informative tokens
  const scored = segments.map(seg => {
    const words = tokenize(seg.text)
    if (words.length === 0) return { seg, score: 0 }
    const score = words.reduce((s, w) => s + (tf[w] ?? 0), 0) / words.length
    return { seg, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.seg.start - b.seg.start) // restore chronological order
    .map(({ seg }) => seg.text)
}
