# MIGRATION_PLAN.md — `old-site/` → Next.js 移行計画書

> ソース・オブ・トゥルース：`old-site/`（Vite + Alpine.js + GSAP）
> 過去の移行成果物（git 履歴に残る旧 `src/`）は**一切流用しません**。`old-site/` のみを正として、ゼロから忠実に再構築します。
> 目標：**移行後のアプリを、元アプリと見た目・操作感・アニメーションすべてにおいて区別できないレベルで再現する。**

---

## 0. 移行タイプ

| 区分 | 内容 |
|---|---|
| 主：フレームワーク移行 | Vite + Alpine.js → **Next.js（App Router）** |
| 従：言語移行 | JavaScript → **TypeScript**（`any` を避け厳密に型付け） |
| データ層 | すでに **Dexie / IndexedDB** を使用 → 同等に移植（新規ストレージ移行は不要） |

---

## 1. 現状（重要）

- `main` には現在 **`old-site/`** と、中身が削除された **`package.json`**（Next.js 16 / React 19 を宣言）だけが残っています。
- 旧移行で作られた `src/`・`next.config.ts`・`tsconfig.json` 等は、直近の `update` コミットで削除済み（git 履歴には残存）。
- → **新規に Next.js アプリを構築**します（旧コードはコピペしません）。

---

## 2. ソース棚卸し（移行対象の全量）

### 2.1 ビュー（`currentView` による単一ページ状態遷移。URL ルーティングは存在しない）

| # | view | 概要 |
|---|---|---|
| 1 | `streak` | 起動直後に表示。炎アイコン・連続日数カウントアップ・週カレンダー・動的メッセージ |
| 2 | `home` | プロジェクト一覧（グリッド）、AI/カテゴリ/設定ボタン、FAB で新規作成 |
| 3 | `study` | スワイプ学習。カード3Dフリップ、進捗バー、スワイプスタンプ、左右ボタン、キーボード操作 |
| 4 | `cardList` | カード一覧（編集・削除）、FAB で追加 |
| 5 | `stats` | 学習進捗バー＋カード別ステータス |
| 6 | `categories` | カテゴリ/タグの CRUD（アコーディオン＝`x-collapse`） |
| 7 | `settings` | データ初期化（Danger Zone） |
| 8 | `ai` | プロンプト生成タブ / JSON インポートタブ |
| + | 完了画面 | `isCompleted` オーバーレイ。ドーナツ accuracy アニメ＋紙吹雪 |

### 2.2 モーダル / ダイアログ

- 汎用ダイアログ（alert / confirm）
- プロジェクト追加 / プロジェクト編集（カスタムセレクト付き）
- カード追加・編集（`backDetails` 複数・アコーディオン・タグ選択セレクト）
- カテゴリ編集 / タグ編集（カラーピッカー）
- トースト（success / error / info、3秒自動消去）

### 2.3 データ層（`old-site/src/js`）

- **Dexie** `FlashcardDB` v1：`categories(id)`, `tags(id)`, `projects(id)`
- 初回ロードで Dexie → 旧 `localStorage(_v4)` → デフォルト定数の順にフォールバック（**Zod `safeParse`** 検証）
- `streakData` は `localStorage('flashcard_streak_data')` に保存
- デバウンス保存（1.5s）＋ `beforeunload` で強制保存、保存キュー制御

### 2.4 アニメーション（GSAP・要忠実再現）

- `gsap.ticker.fps(120)`
- カード：`shuffle` / `shuffleEnter`（elastic）/ `toggleReverse`（rotationY）/ `updateDrag`（lerp 追従, rotation = x*0.04）/ `resetDrag` / `swipeOut`（like時 confetti、nope時シェイク keyframes）/ `swipeNextEnter` / `animateDonut`
- ドラッグ：`createRenderLoop` + `lerpAdjusted(speed=14)`、スワイプ閾値 `innerWidth*0.25`、縦/横モード判定
- 紙吹雪：`canvas-confetti`（右スワイプ・完了時）
- ビュー遷移：CSS クラス（`view-enter-*`）＋ `--tx/--ty` CSS変数で方向を動的切替（`x-transition` 相当）
- CSS `@theme` の `flame` キーフレーム、`--ease-smooth` / `--ease-spring`

### 2.5 アセット / 外部スクリプト

- Google Fonts：`Plus Jakarta Sans` / `Noto Sans JP`
- Font Awesome 6.5.1（CDN）
- スタイル：Tailwind v4（`@import "tailwindcss"`）＋ カスタム CSS 約 1,901 行（`old-site/src/style/**`）

---

## 3. アーキテクチャ方針

元アプリは **「単一ページ＋`currentView` 状態遷移」** の SPA で、ビューごとの URL は存在しません。
忠実再現のため、Next.js でも **単一ルート `/` に状態駆動のビュー切替**を実装します（ビューごとに別ルートへ分割すると、URL・履歴・スクロール・遷移アニメが変わり**非忠実**になるため採用しません）。

```
app/
  layout.tsx        … <html lang="ja">、フォント/Font Awesome、メタ
  page.tsx          … "use client" ルート。状態機械＋全ビュー切替
  globals.css       … old-site の CSS を Tailwind v4 構成で忠実移植
features/flashcard/
  state（React Context or reducer）, hooks（study/streak/drag/toast/dialog）
  db（Dexie client + repository）, schema（Zod）, constants（既定データ）
  animations（gsap client, confetti）
components/flashcard/
  views/*（streak/home/study/cardList/stats/categories/settings/ai）
  modals/*（project/card/category/tag/dialog/colorpicker）, complete-overlay, toast
```

- **コメントは日本語**、コンポーネントは小さく単一責任。
- Alpine の `x-show`/`x-transition`/`x-collapse` は、**同じ CSS クラス**を React の className トグル＋マウント制御で再現（描画結果を一致させる）。
- `$refs` は `useRef`、`$watch` は `useEffect`、`$nextTick`+`requestAnimationFrame` のタイミングも踏襲。

### 技術スタック（既存 `package.json` に準拠）

Next.js 16.2.6 / React 19.2 / TypeScript 6 / Tailwind CSS v4 / Dexie 4 / GSAP 3 / Zod 4 / canvas-confetti。
（インストール可否を実際に検証し、不可の場合は直近の安定版へ調整のうえご報告します。）

---

## 4. 旧 → 新 マッピング（挙動の対応表）

| 旧（Alpine/Vite） | 新（Next/React） | 備考 |
|---|---|---|
| `x-data="flashcardApp()"` | Context + reducer/hooks | 状態を集約 |
| `currentView` | `useState`/context | ビュー切替（ルーティングしない） |
| `x-show` + `x-transition` | className トグル＋遷移用CSS | 同じ `view-enter-*` クラスを使用 |
| `x-collapse`（カテゴリ/詳細） | 高さアニメの同等実装 | duration/easing 一致 |
| `$refs.cardElement` 等 | `useRef` | GSAP 対象 |
| `$watch('currentView')` | `useEffect` | `--tx/--ty` 切替、streak アニメ |
| `window keydown`（study限定） | `useEffect` + ガード | `currentView==='study'` 等の条件を踏襲 |
| Dexie/localStorage I/O | `'use client'` 層で同一実装 | SSR 無効領域として扱う |
| `gsap`/`confetti` を `window` 登録 | 動的 import（client） | SSR 回避 |

---

## 5. 実装順序（依存順）と優先度

1. 足場：`next.config.ts`（静的エクスポート対応含む）/ `tsconfig.json` / ESLint / PostCSS / Tailwind、`pnpm install`
2. グローバル：`layout.tsx`（フォント・FA）、`globals.css`（CSS 全移植）、app-shell
3. データ層：Dexie client + repository、Zod schema、既定定数、ロード/保存/初期化
4. 状態機械＋ビュー遷移コンテナ（`--tx/--ty`、enter/leave）
5. ビュー（leaf）：streak → home → study →（cardList/stats/categories/settings/ai）
6. モーダル群 + トースト + 完了画面
7. アニメーション：GSAP（カード/ドラッグ/シャッフル/ドーナツ）・confetti・キーボード
8. 検証（Step 5）→ PR（Step 6）→ CI/CD（別PR, Step 7）

各ビューは「ビルド/型/見た目/操作/各状態/アクセシビリティ/リグレッション無し」を満たして初めて完了とします。

---

## 6. 変わる点（技術的差分・ユーザー体験は不変）

- ビルド：Vite → Next.js。CSS の **記述方法**は変わるが、**描画結果は不変**。
- JS → TypeScript 化（実行時挙動は不変）。
- `window.gsap/confetti` グローバル参照 → モジュール import（client）。
- これら以外に**色・余白・字形・レイアウト・アニメ・文言の変更は行いません**。

---

## 7. リスクと対策

| リスク | 対策 |
|---|---|
| ドラッグ/スワイプ物理（lerp・閾値・rotation）のズレ | 数値（speed=14, 0.04, 0.25, fps120）を完全一致で移植し実機検証 |
| `x-transition` の方向別遷移の差 | 同一 CSS クラス＋`--tx/--ty` をそのまま使用 |
| SSR と DOM/IndexedDB 依存の衝突 | client 境界を明確化、`window`/`document` はマウント後 |
| 静的エクスポート（GitHub Pages, basePath）での挙動 | `next.config.ts` を復元し `BUILD_STATIC_EXPORT`/`BASE_PATH` 対応、別PRで検証 |
| Tailwind v4 のユーティリティ差異 | 必要なカスタム CSS（colors.css 等）を忠実移植 |

---

## 8. 検証（完了条件）

- `pnpm build` / `pnpm lint` / `pnpm typecheck` がすべてゼロエラー
- 全ビューをブラウザ実機確認（`testing-flashcard` スキル使用）、コンソールエラー/Reactワーニングゼロ
- old-site と移行版を各ブレークポイントで**ピクセル比較**し、差分をすべて解消
- 操作・アニメ・データ永続化が一致
- 録画を取得し PR に添付

---

## 9. 前提・ルール

- `old-site/` は**一切変更・削除しない**（保持）。
- `main` へ直接 push しない。専用ブランチ `migrate/<ts>-oldsite-nextjs` で作業。
- 移行本体と CI/CD 変更は**別 PR**。
- ソースにバグ/不整合を見つけても**勝手に直さず**ご相談します。

---

## 10. リファクタリングの目的・制約（現行 Next.js）

- **見た目・挙動・アニメーションは不変**（UI/UX の仕様変更は行わない）。
- `old-site/` は **保持**（削除・改変しない）。
- 既存の CSS クラス名は **維持**（再利用前提）。
- 目的は **責務分割と可読性の向上**であり、機能追加は行わない。
- 現行構成（棚卸し）:
  - `src/features/flashcard/state`（状態・UI 操作・セッション制御）
  - `src/features/flashcard/data`（Dexie/Schema/Types/Constants）
  - `src/features/flashcard/animations`（GSAP/drag/confetti）
  - `src/features/flashcard/ui`（views/modals/共通 UI）

---

## 11. 回帰確認の基準（リファクタ）

- `pnpm lint` / `pnpm typecheck` / `pnpm build` がすべて成功すること。
- 旧 UI と **ビュー遷移・アニメ・操作感の一致**（`testing-flashcard` スキルを使用）。
- Dexie / localStorage の **読み書き・移行・保存キュー**が従来通りに機能すること。
