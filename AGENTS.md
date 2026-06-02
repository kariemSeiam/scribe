# SCRIBE — Agent & Developer Manual

> The canonical reference for agents, contributors, and future-you.  
> Read this before touching anything. Update it when something changes.

---

## The One Immutable Constraint

```js
// next.config.js
output: 'export'
```

Static export. No server. No API routes. No `cookies()`. No `headers()`. No SSR.  
Every byte of computation runs in the browser. This is not changing.

---

## Mental Model

```
Browser
  └── page.tsx  (orchestration only — no logic, no state)
        ├── useExtractor()        ← all async state lives here
        │     └── extract()       ← src/lib/extractor/index.ts
        │           ├── invidious.ts    (primary source)
        │           └── yt-captions.ts  (fallback)
        └── Components            ← receive data, never fetch
```

**Rule:** If you're adding a `fetch()` call to a component, stop. It belongs in `use-extractor.ts` or `lib/extractor/`.

---

## Navigation Map

| You want to... | Go here |
|----------------|---------|
| Change how transcripts are extracted | `src/lib/extractor/invidious.ts` |
| Change the fallback extraction source | `src/lib/extractor/yt-captions.ts` |
| Change which source is tried first / the waterfall | `src/lib/extractor/index.ts` |
| Update Invidious instance list | `src/lib/extractor/invidious.ts` → `INSTANCES` |
| Change state shape or actions | `src/types/index.ts` + `src/hooks/use-extractor.ts` |
| Add a keyboard shortcut | `src/hooks/use-keyboard.ts` |
| Add an export format | `ExportFormat` in `types/index.ts` → `export.ts` → `export-menu.tsx` |
| Change colors or visual tokens | `src/styles/globals.css` → CSS custom properties |
| Change Tailwind config | `tailwind.config.ts` |
| Change summarization logic | `src/lib/summarize.ts` |
| Add a new page | `src/app/[page]/page.tsx` |

---

## Type System

All shared types live in `src/types/index.ts`. Never redeclare them elsewhere.

### `ExtractionResult` — discriminated union on `contentType`

```ts
type ExtractionResult =
  | { contentType: 'video';    videoInfo: VideoInfo; transcript: TranscriptSegment[]; summary: string[] }
  | { contentType: 'playlist'; playlistInfo: PlaylistInfo }
  | { contentType: 'channel';  channelInfo: ChannelInfo }
```

Narrow with `result.contentType === 'video'`. TypeScript will type-guard the rest.

### `ExtractorState` — discriminated union on `status`

```ts
type ExtractorState =
  | { status: 'idle' }
  | { status: 'loading'; message: string }
  | { status: 'success'; result: ExtractionResult }
  | { status: 'error';   message: string }
```

All transitions live in `use-extractor.ts::reducer`. Pattern-match on `state.status` in components.

---

## Data Flow (complete)

```
1. User pastes URL → UrlBar.onSubmit → useExtractor.run(url)
2. dispatch({ type: 'START' })  →  state: loading
3. extract(url, onProgress)                    [lib/extractor/index.ts]
   a. extractVideoId / extractPlaylistId / extractChannelId  [utils.ts]
   b. if videoId:
      i.  workingInstance() — races all INSTANCES, resolves first 200 OK
      ii. GET /api/v1/videos/{id}  →  VideoInfo
      iii.fetchCaptions()  →  GET /{captionUrl}&fmt=vtt  →  parseVTT()
      iv. if transcript empty: fetchYouTubeCaptions()  [yt-captions.ts]
          → CORS proxy → youtube.com/api/timedtext?v=ID&fmt=json3
      v.  summarize(transcript)  [summarize.ts — pure TF-IDF]
      vi. return ExtractionResult
   c. if playlistId: fetchPlaylistData()
   d. if channelId:  fetchChannelData()
4. dispatch({ type: 'SUCCESS', result })  →  state: success
5. page.tsx renders matching branch via AnimatePresence
```

---

## Invariants

These are non-negotiable. Violating them breaks predictability.

| # | Rule |
|---|------|
| 1 | **`src/lib/` is pure.** No React, no hooks, no DOM, no side effects. |
| 2 | **Components receive data via props. They never fetch.** |
| 3 | **`use-extractor.ts` owns all extraction state.** No parallel `useState` for loading/error. |
| 4 | **TypeScript strict.** `any` is banned. Non-null assertions (`!`) need a comment. |
| 5 | **No hardcoded colors.** Always `hsl(var(--token))` from `globals.css`. |
| 6 | **Invidious instances must be verified before adding.** Test: `GET {instance}/api/v1/stats → 200`. |
| 7 | **`src/components/ui/` is untouched.** Don't modify shadcn primitives — replace them if needed. |

---

## Design Token Reference

All tokens are CSS custom properties on `:root` and `.dark`. Tailwind maps them.

| Token | Dark value | Purpose |
|-------|-----------|---------|
| `--background` | `#080808` | Page background |
| `--surface` | `#111111` | Card / panel backgrounds |
| `--surface-raised` | `#181818` | Hover states, elevated surfaces |
| `--border` | `#202020` | Default borders |
| `--border-hover` | `#383838` | Hovered borders |
| `--foreground` | `#F2F2F2` | Primary text |
| `--muted` | `#6A6A6A` | Secondary text, icons |
| `--accent` | `#FF3B3B` | Primary action color |
| `--accent-hover` | `#E02E2E` | Accent on hover |
| `--destructive` | `#FF3B3B` | Error states |

---

## Invidious Instance Health

Instances go stale without notice. When extraction fails consistently:

1. Open browser DevTools console — errors name the instance and status code.
2. Check [instances.invidious.io](https://instances.invidious.io) for a current health list.
3. Update `INSTANCES` in `src/lib/extractor/invidious.ts`.
4. Commit with message: `fix: update Invidious instance list`.

Health test (run in browser console or curl):
```bash
curl -s https://your-instance.example/api/v1/stats | jq '.software.name'
# expected: "invidious"
```

---

## Error Taxonomy

| Error message | Root cause | Resolution |
|---------------|-----------|-----------|
| `All Invidious instances unreachable` | Every instance timed out (5s timeout per) | Update `INSTANCES` array |
| `No captions found. This video may not have subtitles enabled.` | Video has no caption track | Expected — nothing to fix |
| `Could not reach any extraction source.` | Invidious + CORS proxies all failed | Network issue or stale instances |
| `Not a valid YouTube URL.` | Input doesn't match any URL pattern | User input error |
| `Invidious returned 404` | Video deleted, private, or age-restricted | Expected |
| `Invidious returned 429` | Rate-limited by instance | Switch instance or wait |

---

## Adding an Export Format

Step-by-step. Each step must compile before moving to the next.

```
1. src/types/index.ts
   Add the new id to ExportFormat:
   export type ExportFormat = 'txt' | 'srt' | 'md' | 'json' | 'YOUR_FORMAT'

2. src/lib/export.ts
   Add a case to exportTranscript():
   case 'YOUR_FORMAT':
     return download(buildYourFormat(segments, video), `${name}.ext`, 'mime/type')

3. src/components/extractor/export-menu.tsx
   Add to FORMATS array:
   { id: 'YOUR_FORMAT', label: 'Label', ext: '.ext', Icon: SomeIcon }
```

---

## Dev Commands

```bash
npm run dev          # dev server → http://localhost:3000
npm run type-check   # tsc --noEmit  (run before every commit)
npm run build        # static export → ./out/  (must succeed for CI to pass)
npm run lint         # ESLint
```

## Deployment

Push to `main` → `.github/workflows/deploy.yml` → `npm run build` → GitHub Pages.

**One-time setup:**
- Repo → Settings → Pages → Source: **GitHub Actions**
- Repo → Settings → Variables → `NEXT_PUBLIC_BASE_PATH` = `/scribe`

For a custom domain: point DNS → GitHub Pages, set `NEXT_PUBLIC_BASE_PATH` to `''`.

---

*Keep this file current. A stale AGENTS.md is worse than no AGENTS.md.*
