import type { VideoInfo, TranscriptSegment } from '@/types'

export const demoVideoInfo: VideoInfo = {
  id: 'dQw4w9WgXcQ',
  title: 'The State of Modern Web Development — 2024 Deep Dive',
  author: 'Web Dev Perspectives',
  authorId: 'UCdemo',
  thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  duration: 612,
  uploadDate: '2024-03-12T00:00:00.000Z',
  viewCount: 847_200,
  description: 'A comprehensive overview of modern web development tools, frameworks, and best practices entering 2024.',
}

export const demoTranscript: TranscriptSegment[] = [
  { text: "Today we'll explore the tools and techniques that are fundamentally changing how we build for the web.", start: 0, duration: 6.5 },
  { text: "React's component model has become the mental framework most developers default to — and for good reason. It maps naturally to how UIs decompose.", start: 6.5, duration: 9.2 },
  { text: "Next.js has emerged as the standard way to ship React to production — server rendering, static export, and the new App Router give you every deployment model in one framework.", start: 15.7, duration: 10.1 },
  { text: "TypeScript is no longer optional on serious projects. The type system catches entire categories of bugs before runtime and makes large codebases navigable.", start: 25.8, duration: 8.9 },
  { text: "Tailwind CSS resolved the decade-long argument about how to write styles at scale. Utility-first works. The initial resistance was aesthetic, not practical.", start: 34.7, duration: 9.4 },
  { text: "Radix UI and similar headless libraries solve accessibility correctly so you don't have to. ARIA is complex — don't reinvent it.", start: 44.1, duration: 8.0 },
  { text: "State management has simplified dramatically. For most apps, React's own hooks plus a thin server-state layer like TanStack Query is all you need.", start: 52.1, duration: 9.3 },
  { text: "The edge is real. Cloudflare Workers, Vercel Edge Runtime — if you're doing compute close to users, latency improvements are measurable and user-visible.", start: 61.4, duration: 9.8 },
  { text: "Testing strategy matters more than testing volume. Integration tests that hit real databases beat a thousand mocked unit tests when it comes to catching actual bugs.", start: 71.2, duration: 10.0 },
  { text: "The biggest shift of 2024 is AI-augmented development — not replacing developers, but compressing the time between idea and working code by an order of magnitude.", start: 81.2, duration: 10.5 },
  { text: "The fundamentals still win. Performance, accessibility, correctness. Frameworks come and go. Those three don't.", start: 91.7, duration: 7.8 },
]

export const demoLinks = {
  video: 'https://youtu.be/dQw4w9WgXcQ',
  playlist: 'https://www.youtube.com/playlist?list=PLillGF-RfqbZTASqIqdvm1R5mLrQq79CU',
  channel: 'https://www.youtube.com/@fireship',
}
