<div align="center">

<br/>

```
 ___  ___  ____  ____  ____  ____
/ __)/ __)(  _ \(_  _)(  _ \( ___)
\__ \\__ \ )___/ _)(_  ) _ < )__)
(___/(___/(__)  (____)(____/(____)
```

### Every word, captured.

<br/>

[![Deploy](https://github.com/kariemseiam/scribe/actions/workflows/deploy.yml/badge.svg)](https://github.com/kariemseiam/scribe/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)

**[Live →](https://kariemseiam.github.io/scribe)**

</div>

---

## What it is

SCRIBE extracts transcripts from any YouTube video, playlist, or channel — directly in the browser, with no server, no API key, and no login.

Paste a URL. Get the words. Done.

---

## Features

| | |
|---|---|
| **Extraction** | Video · Playlist · Channel — all three URL types |
| **Dual-source** | Invidious (8-instance race) → YouTube timedtext fallback |
| **Summary** | TF-IDF key points, runs in-browser, instant |
| **Search** | Fuzzy transcript search with inline highlighting |
| **Export** | `.txt` · `.srt` (subtitles) · `.md` · `.json` |
| **Timestamps** | Click any segment → copies a deep-link (`youtu.be/ID?t=83`) |
| **Keyboard** | `⌘K` focus · `Escape` reset · dark mode default |
| **Free** | No account. No quota. No infra. GitHub Pages. |

---

## How it works

Everything runs in the browser. No server.

```
URL  →  parse type  →  Invidious API (8 instances, race)
                    →  VTT caption file  →  parsed segments
                    →  [fallback] YouTube timedtext via CORS proxy
                    →  TF-IDF summary
                    →  render
```

[Invidious](https://invidious.io) is an open-source YouTube frontend with a public, CORS-safe REST API. SCRIBE races 8 public instances and uses whichever responds first, with a fallback to YouTube's own caption API via a CORS proxy.

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | Static export, clean routing |
| Language | TypeScript strict | No `any`, discriminated unions throughout |
| Styling | Tailwind CSS + custom tokens | Consistent design system, zero runtime |
| Primitives | Radix UI / shadcn | Accessible, unstyled, composable |
| Animations | Framer Motion | Precise, interruptible |
| Search | Fuse.js | Fuzzy match, zero backend |
| Extraction | Invidious REST API | CORS-safe, no API key |
| Deploy | GitHub Actions → GitHub Pages | Zero cost, always on |

---

## Local development

```bash
git clone https://github.com/kariemseiam/scribe
cd scribe
npm install
npm run dev          # → http://localhost:3000
```

```bash
npm run type-check   # TypeScript validation
npm run build        # production static export → ./out/
npm run lint         # ESLint
```

Copy `.env.example` → `.env.local` if you need to set `NEXT_PUBLIC_BASE_PATH` locally.

---

## Deployment

Automatic on push to `main`. See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

**Required setup:**
1. Enable GitHub Pages in repo Settings → Pages → Source: GitHub Actions
2. Add repo variable: Settings → Variables → `NEXT_PUBLIC_BASE_PATH` = `/scribe`
   *(omit or leave empty for a custom domain)*

---

## Project structure

```
src/
├── app/                    Next.js App Router
│   ├── layout.tsx          Root layout, metadata, theme
│   ├── page.tsx            Main page — orchestration only, no logic
│   ├── error.tsx           React error boundary
│   └── not-found.tsx       404 page
│
├── components/
│   ├── extractor/          Domain components
│   │   ├── url-bar.tsx     Primary input — the hero UX moment
│   │   ├── video-card.tsx  Video metadata display
│   │   ├── transcript-viewer.tsx  Search + segment list
│   │   ├── segment.tsx     One row: timestamp + text, copyable
│   │   ├── stats-bar.tsx   Segment count · word count · read time
│   │   ├── export-menu.tsx TXT / SRT / MD / JSON dropdown
│   │   └── summary-card.tsx  Key points panel
│   ├── layout/             Header, Footer
│   └── ui/                 Radix/shadcn primitives (do not modify)
│
├── hooks/
│   ├── use-extractor.ts    useReducer state machine — all extraction state
│   └── use-keyboard.ts     Global keyboard shortcuts
│
├── lib/
│   ├── extractor/
│   │   ├── index.ts        Waterfall: parse → Invidious → YT fallback
│   │   ├── invidious.ts    Invidious HTTP client + VTT parser
│   │   └── yt-captions.ts  YouTube timedtext via CORS proxy
│   ├── summarize.ts        TF-IDF extractive summarization
│   ├── export.ts           Multi-format export + clipboard
│   ├── demo-data.ts        Offline demo content
│   └── utils.ts            Formatters, URL parsers, cn()
│
└── types/index.ts          All shared types — import from here only
```

---

## For agents and contributors

See **[AGENTS.md](./AGENTS.md)** for the full developer manual: data flow diagram, invariants, error taxonomy, and navigation map.

---

## License

MIT © [Kariem Seiam](https://github.com/kariemseiam)
