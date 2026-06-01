---
name: testing-flashcard
description: Test UI/UX/animation parity between the Vite+Alpine.js old-site and the new Next.js flashcard app. Use this skill whenever verifying that page transitions, GSAP animations, swipe physics, study flow, CRUD operations, or data persistence behave identically in both versions. Always use this skill before marking any migration task as complete.
---

# Flashcard App — Parity Testing Guide

## Purpose

Verify that the Next.js rewrite produces **identical** UI, UX, and animation behaviour compared to `old-site/` (Vite + Alpine.js + GSAP). Every visual detail — GSAP timing, easing curves, trigger conditions, layout — must match. The old-site is the source of truth.

---

## Tech Stack Differences (old vs new)

| Concern | old-site | Next.js |
|---------|----------|---------|
| Framework | Vite + Alpine.js | Next.js + React |
| Animations | **GSAP** | Must replicate GSAP behaviour |
| Interactivity | Alpine.js directives | React state/hooks |
| Confetti | canvas-confetti | canvas-confetti (same lib) |
| Validation | Zod | Zod (same lib) |
| Storage | Dexie.js + localStorage | Dexie.js + localStorage (same) |

When an animation feels wrong in Next.js, **look up the GSAP call in old-site source first** and match the exact `duration`, `ease`, `stagger`, and `delay` values.

---

## Setup: Run Both Sites Simultaneously

```bash
# Terminal 1 — old-site (Vite, source of truth)
cd old-site
pnpm dev          # or: npm run dev
# → http://localhost:5173  (Vite default)

# Terminal 2 — Next.js app (rewrite under test)
pnpm dev
# → http://localhost:3000
```

Keep both open side-by-side for direct comparison. Use browser DevTools → Performance tab to record and compare animation timelines when a difference is subtle.

---

## Navigation Map

| Page | Next.js URL | old-site screen | How to reach |
|------|-------------|-----------------|--------------|
| Streak | `/` | Streak screen | App load |
| Home | `/home` | Home screen | Click "続ける" on streak page |
| Study | `/study` | Study screen | Click a project card body |
| Card List | `/study/cards` | Card list overlay | Click list icon in study header |
| Categories | `/categories` | Categories screen | Click tag icon in /home header |
| Settings | `/settings` | Settings screen | Click gear icon in /home header |
| AI | `/ai` | AI screen | Click wand icon in /home header |
| Stats | `/stats` | Stats screen | Click stats icon on a project card |

---

## GSAP Animation Checklist

GSAP is used in old-site for all major animations. For each item below, read the relevant GSAP call in old-site source (`gsap.to`, `gsap.from`, `gsap.fromTo`, `gsap.timeline`) and confirm the Next.js version produces a visually identical result.

### Key GSAP properties to match exactly
- `duration` — seconds, not ms
- `ease` — e.g. `"power2.out"`, `"back.out(1.7)"`, `"elastic.out(1, 0.3)"`
- `stagger` — per-element delay in list/card entrances
- `delay` — initial wait before animation starts
- `y` / `x` / `scale` / `opacity` — start and end values
- `onComplete` — callback timing (e.g. navigate after card flies out)

### Page Transitions
- [ ] **Entrance direction and offset** — which axis, how many px/% does it slide from?
- [ ] **Duration and easing** — read exact values from old-site
- [ ] **Exit animation** — does old-site animate the outgoing page too?
- [ ] **Back navigation** — reverse direction, same duration?
- [ ] **Stagger on list items** — if cards/items animate in sequence, stagger delay matches?

### Flashcard Swipe (Study screen)
- [ ] **Drag follow** — card position tracks pointer; no lag or overshoot mismatch
- [ ] **Rotation** — card tilts as it moves; pivot point and max angle match
- [ ] **LIKE/NOPE stamp** — opacity tied to drag distance, threshold matches old-site
- [ ] **Throw-out animation** — `gsap.to` x/y/rotation/opacity on release; duration + ease match
- [ ] **Bounce-back animation** — releasing without threshold snaps back; spring feel matches
- [ ] **Stack reveal** — next card scales or fades in from underneath; timing matches
- [ ] **Button-triggered swipe** — LIKE/NOPE buttons fire same throw-out animation as drag

### Streak Screen
- [ ] Flame / counter entrance animation (scale, fade, bounce?)
- [ ] Count-up number animation if present
- [ ] "続ける" button press feedback

### Home Screen — Card List Entrance
- [ ] Cards stagger in on first render — stagger value matches
- [ ] Each card's `y` offset and `opacity` start values match
- [ ] Hover / press scale or shadow transition timing matches

### Session Complete Screen
- [ ] canvas-confetti fires with same timing relative to screen appearance
- [ ] Accuracy %, LIKE count, NOPE count reveal animation (count-up? fade-in?)
- [ ] Action buttons entrance timing

---

## Page-by-Page Visual Checklist

For each screen, verify layout in both sites with identical viewport size (e.g. 390×844 mobile).

### `/` Streak Page
- [ ] Streak count display and formatting
- [ ] Flame/icon size and position
- [ ] "続ける" button: size, colour, corner radius, shadow
- [ ] Background colour / gradient

### `/home` Home Page
- [ ] Header icon row: spacing, icon size, tap target
- [ ] Project card: width, padding, border radius, shadow
- [ ] Card metadata: font size, colour, layout
- [ ] Stats icon: position, visibility
- [ ] Empty state UI

### `/study` Study Page
- [ ] Card face: question text size, padding, font weight
- [ ] Card back: answer layout, tag chips
- [ ] LIKE button: colour (`#4CAF50`-ish green?), icon, size
- [ ] NOPE button: colour (red?), icon, size
- [ ] Progress bar or counter (if any)
- [ ] Header: back arrow, list icon — position and size

### `/study/cards` Card List
- [ ] Row height, dividers, padding
- [ ] Edit / delete affordances (swipe to delete? icon buttons?)
- [ ] Scroll momentum

### `/categories`, `/settings`, `/ai`, `/stats`
- [ ] Header style matches other pages
- [ ] Form input appearance (border, focus ring, padding)
- [ ] Button and action styles
- [ ] Empty states

---

## Primary Study Session Test Flow

1. Open both sites at root (`/` and `http://localhost:5173`)
2. Note streak count — should use same localStorage key (`flashcard_streak_data`)
3. Click "続ける" → verify page transition animation matches
4. Click a project card → study screen
5. Perform **LIKE 3 times, NOPE 2 times** (or any fixed sequence)
   - Watch swipe animations frame-by-frame if needed (DevTools slow motion: `gsap.globalTimeline.timeScale(0.1)` in console on old-site)
6. After all cards, Session Complete screen:
   - LIKE count = 3, NOPE count = 2, accuracy = 60%
   - Confetti should fire
7. Repeat with keyboard: `→` = LIKE, `←` = NOPE

**Slow-motion debug tip:** paste this in old-site console to see GSAP animations at 10% speed:
```js
gsap.globalTimeline.timeScale(0.1)
```
Then visually match what the Next.js version does at full speed.

---

## CRUD Verification

### Create
- [ ] New project form: submit animation / page transition
- [ ] Add card: inline append animation or list refresh

### Read
- [ ] Cards appear in same order as old-site
- [ ] Stats page numbers match

### Update
- [ ] Edit card: changes persist after hard reload (`Ctrl+Shift+R`)
- [ ] Rename project: same

### Delete
- [ ] Delete card: removal animation (slide? fade? height collapse?)
  - old-site may use Alpine.js `x-collapse` (from `@alpinejs/collapse`) + GSAP — check source
- [ ] Delete project: confirmation UI matches

---

## Data Persistence Checks

Both sites use the same storage layer (Dexie.js + localStorage), so schemas must be identical.

```js
// Browser console — check localStorage
Object.keys(localStorage)  // must include: flashcard_streak_data

// DevTools → Application → IndexedDB
// Database name and table names must match between old and new
// Tables: categories, tags, projects (with nested cards array)
```

- [ ] Streak survives reload
- [ ] New cards persist after reload
- [ ] Debounced save: edit something → wait 2 seconds → hard-reload → data present
- [ ] `beforeunload` force-save: edit → close tab immediately → reopen → data present

---

## Build Verification (Next.js)

```bash
pnpm run build   # 0 TypeScript errors, 0 build errors
pnpm run lint    # 0 ESLint warnings/errors
```

---

## Pass / Fail Criteria

| Category | Pass | Fail |
|----------|------|------|
| GSAP timing/easing | Visually identical; any diff imperceptible | Noticeably different speed or curve |
| Page transitions | Direction, duration, easing match old-site | Different axis, too fast/slow, missing |
| Swipe physics | Same drag feel, rotation, threshold | Card sticks, snaps wrong, rotation off |
| Confetti | Fires at same moment, same density | Missing, fires too early/late |
| Layout (mobile) | Pixel-close at 390px wide | Visible spacing/sizing discrepancy |
| Session stats | LIKE/NOPE counts match actions | Any count shows 0 or wrong value |
| Data persistence | All data survives hard reload | Any data lost |
| Navigation | All routes reachable, no blank screens | 404, white screen, or hydration error |

---

## Known Pitfalls

- **Session stats reset**: `useEffect` on full `project` object resets stats on every swipe. Fix: depend on `project.id` only, use `prevProjectId` ref.
- **Stale closure in setTimeout**: stats captured inside `setTimeout` may be stale. Fix: `useRef` to track stats synchronously.
- **GSAP ease names**: Next.js must import GSAP with the same registered plugins (e.g. `gsap.registerPlugin(...)`) that old-site uses — check old-site's GSAP import for plugins.
- **Alpine.js `x-collapse`**: old-site uses `@alpinejs/collapse` for height animations on delete. Replicate with GSAP `height` tween or CSS `max-height` transition in Next.js.
- **IME input**: Japanese text via automated `type` action may not trigger Alpine.js or React input events correctly. Test Japanese input manually.
- **Port conflicts**: Vite defaults to 5173, Next.js to 3000. If either port is taken they auto-increment — check terminal output.

---

## Data Architecture Reference

| Storage | Contents | Library | Notes |
|---------|----------|---------|-------|
| IndexedDB | categories, tags, projects (nested cards) | Dexie.js | Same in both sites |
| localStorage | streak data | native | Key: `flashcard_streak_data` |

old-site state: Alpine.js reactive data + Dexie.js  
Next.js state: React Context (`FlashcardProvider`) + Dexie.js  
Save strategy: 1500ms debounce + `beforeunload` force-save (both sites)
