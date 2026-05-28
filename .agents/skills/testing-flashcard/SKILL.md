---
name: testing-flashcard
description: Test the flashcard Next.js app end-to-end. Use when verifying UI, study flow, CRUD, or data persistence changes.
---

# Testing the Flashcard App

## Prerequisites
- Node.js v22+ and pnpm installed
- Run `pnpm install` then `pnpm dev` to start dev server on localhost:3000

## Dev Server
```bash
pnpm dev
```
The app runs on `http://localhost:3000`. No authentication required — it's a client-side only app using IndexedDB (via Dexie.js) and localStorage.

## Build & Lint
```bash
pnpm run build    # next build — verifies no TS or build errors
pnpm run lint     # next lint
```
There is no `pnpm test` command configured. Testing is done via browser UI.

## Key Pages & Navigation
| Page | URL | How to reach |
|------|-----|-------------|
| Streak | `/` | Root page, shown on app load |
| Home | `/home` | Click "続ける" on streak page |
| Study | `/study` | Click a project card on /home |
| Card List | `/study/cards` | Click list icon in study header |
| Categories | `/categories` | Click tag icon in /home header |
| Settings | `/settings` | Click gear icon in /home header |
| AI | `/ai` | Click wand icon in /home header |
| Stats | `/stats` | Click stats icon on a project card in /home |

## Primary Test Flow (Study Session)
1. Navigate to `/` then click "続ける" to go to `/home`
2. Click a project card body (not action buttons) to go to `/study`
3. Swipe cards using LIKE (覚えた) / NOPE (まだ) buttons or arrow keys
4. After all cards, Session Complete screen shows accuracy %, LIKE count, NOPE count
5. Verify counts are non-zero and match actions taken

## Known Pitfalls
- **Session stats reset bug**: If `useEffect` depends on the full `project` object instead of `project.id`, stats reset to 0 on every swipe because `handleCardSwiped` updates the project reference. The fix uses a `prevProjectId` ref.
- **Stale closure in setTimeout**: Session stats computed inside `setTimeout` may capture stale React state. The fix uses `useRef` to track stats synchronously.
- **IME input**: Japanese text input via `type` action may not work in automated testing. Use English text for test inputs.
- **Port conflicts**: If port 3000 is in use, Next.js auto-selects another port (e.g., 3002). Check dev server output.

## Data Architecture
- **IndexedDB** (Dexie.js): categories, tags, projects (with nested cards)
- **localStorage**: streak data (`flashcard_streak_data`)
- State managed via React Context (`FlashcardProvider`)
- 1500ms debounced save to IndexedDB + `beforeunload` force save

## Devin Secrets Needed
None — the app is entirely client-side with no external API dependencies.
