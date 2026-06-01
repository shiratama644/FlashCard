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

> ⚠️ **重要 — URLルーティングは無し。** old-site も新Next.jsアプリも、画面遷移は `currentView` 状態で切り替わる**単一ページSPA**。新アプリでも URL は常に `/`（静的エクスポート時は `/flashcard/`）のままで、ビューを切り替えても URL は変化しない。ブラウザの戻る/進むボタンでビューは戻らない（履歴を操作しない）。ビューへの到達はすべて**画面内のボタン/アイコン操作**で行う。

| View (`currentView`) | URL（両サイト共通） | How to reach |
|------|------|--------------|
| `streak` | `/` | アプリ起動直後（ローダー後） |
| `home` | `/`（変化なし） | streak 画面の「続ける」ボタン |
| `study` | `/`（変化なし） | home でプロジェクトカード本体をクリック |
| `cardList` | `/`（変化なし） | study ヘッダーのリストアイコン |
| `categories` | `/`（変化なし） | home ヘッダーのタグアイコン |
| `settings` | `/`（変化なし） | home ヘッダーの歯車アイコン |
| `ai` | `/`（変化なし） | home ヘッダーのワンドアイコン |
| `stats` | `/`（変化なし） | プロジェクトカードの統計アイコン |

ビュー切替アニメーションは CSS 変数 `--tx` / `--ty`（`cardList`/`stats` は横方向 2.5rem、その他は縦方向 2.5rem）で方向が決まる。新アプリでは `FlashcardStore` の `currentView` setter がこの変数を設定する（old-site の `init.js` の `$watch('currentView')` 相当）。

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

### Home view
- [ ] Header icon row: spacing, icon size, tap target
- [ ] Project card: width, padding, border radius, shadow
- [ ] Card metadata: font size, colour, layout
- [ ] Stats icon: position, visibility
- [ ] Empty state UI

### Study view
- [ ] Card face: question text size, padding, font weight
- [ ] Card back: answer layout, tag chips
- [ ] LIKE button: colour (`#4CAF50`-ish green?), icon, size
- [ ] NOPE button: colour (red?), icon, size
- [ ] Progress bar or counter (if any)
- [ ] Header: back arrow, list icon — position and size

### Card List view (`cardList`)
- [ ] Row height, dividers, padding
- [ ] Edit / delete affordances (swipe to delete? icon buttons?)
- [ ] Scroll momentum

### Categories / Settings / AI / Stats views
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
7. Repeat with keyboard: `→` = LIKE, `←` = NOPE, `Space`/`↑`/`↓` = カードめくり（flip）
   - ガード条件（old-site 準拠）: `currentView === 'study'` かつ カードあり かつ `!isAnimating` かつ `!isCompleted` のときのみ反応。それ以外のビューではキー操作は無効。

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
| Navigation | 全ビューが画面内操作で到達可・URLは `/` のまま | ビューが切り替わらない、白画面、hydration error |

---

## Known Pitfalls（今回のアーキテクチャ前提）

新アプリは Alpine.js の「フィールド直接代入→リアクティブ再描画」を、可変インスタンス `FlashcardStore` + `commit()`（React 再描画トリガ）で再現している。React hooks ベースではない点に注意。

- **再描画されない**: ストアのフィールドを変更したのに画面が更新されない場合、`store.commit()`（または `store.update(fn)` / `store.render()`）が呼ばれているか確認する。直接代入のみでは再描画されない。
- **ビュー切替アニメ**: `Transition` / `DefaultTransition` / `Collapse` コンポーネントが Alpine の `x-transition` / 既定トランジション / `x-collapse`（250ms, `cubic-bezier(0.4,0,0.2,1)`）を再現する。タイミングがズレて見えたら old-site の該当ディレクティブ/CSS と値を突き合わせる。
- **`--tx`/`--ty`**: ビュー遷移方向はこの CSS 変数で決まる。`cardList`/`stats` だけ横方向になるのは仕様（要確認ポイント）。
- **ハイドレーション**: ルート（`App.tsx`）はマウント後にのみ本体を描画する（`new Date()` 由来の streak メッセージ等の SSR 不整合回避）。初回は `#global-loader` のみ表示 → `store.init()`（effect）完了後に表示される。白画面のままなら `store.isLoaded` と init のエラーを確認。
- **GSAP**: `gsap.ticker.fps(120)` を含め、`duration`/`ease`/`stagger`/`delay` は `src/lib/animations/*` が old-site の `old-site/src/js/animations/*` を忠実移植している。差異があれば両者の値を直接比較する。
- **キーボード**: ハンドラは `App.tsx` の window `keydown` リスナー。study ビュー限定のガード条件を満たすか確認（上記参照）。
- **IME input**: 日本語入力を自動 `type` で行うと Alpine.js / React の input イベントが正しく発火しないことがある。日本語入力は手動で確認する。
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
