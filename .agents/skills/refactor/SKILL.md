---
name: refactor
description: old-site (Vite + Alpine.js) を忠実移植した現行コードを、React 19 / Next.js 16 の最新の書き方に沿ってパフォーマンス・保守性の観点でリファクタするためのガイド。ストアの全再描画問題の解消、Server/Client 境界の最適化、ハイドレーション・フォント・GSAP まわりの近代化に取り組むときに必ず参照する。挙動・UI・アニメーションの互換性は維持したままリファクタすること。
---

# Refactor: old-site 忠実移植コードを React 19 / Next 16 流に近代化する

このリポジトリ（`shiratama644/flashcard`）は、`old-site/`（Vite + Alpine.js + GSAP）の挙動を **1:1 で忠実移植** したものです。そのため Alpine.js 由来の設計がそのまま持ち込まれており、React 19 / Next 16 のイディオムから乖離しています。このスキルは「**見た目・挙動・アニメーションを変えずに**」内部実装だけを近代化するためのリファクタ手順をまとめたものです。

## 大前提（必ず守る制約）

- **挙動・UX・アニメーションの互換性を壊さない。** 元は old-site との完全一致を目指した移植。リファクタは内部実装のみで、ユーザー体験は同一に保つ。判断に迷ったら `old-site/` の対応箇所を参照して期待挙動を確認する（`old-site/` は削除されている場合があるので、無ければ git 履歴か現行コードの日本語コメントの出典表記を頼る）。
- **UIテキスト・コードコメントは日本語。** 英語UIは既存で意図的に使われている箇所のみ。
- **モバイルファースト / タッチ操作前提。**
- **TypeScript を優先。** `any` / `getattr` 的な逃げは禁止。型が分からなければコードを読んで正しい型を使う。
- **小さなステップで進める。** 1PR = 1関心事。全面書き換えを一気にやらない。レビュー可能な粒度に分割する。
- **main へ直 push 禁止。** 専用ブランチ + 日本語コミットメッセージ（例: `refactor: ストアの全再描画を useSyncExternalStore に置換`）。
- **既存ファイルの無断削除をしない。** 削除が必要なら事前にユーザーへ確認。
- **報告前に必ずビルドが通ることを確認する。**

## 検証コマンド（リファクタの各ステップ後に必ず実行）

```bash
pnpm lint        # eslint . --cache
pnpm typecheck   # tsc --noEmit
pnpm build       # next build
pnpm verify      # = lint + typecheck + build（PR前にこれを通す）
pnpm dev         # 手元での目視確認（http://localhost:3000）
```

`pnpm verify` が緑になることが「壊していない」ことの最低条件。挙動確認は `pnpm dev` で目視（または `.agents/skills/testing-flashcard` があればそれを使う）。

## 現状アーキテクチャ（リファクタ対象の「におい」）

`src/features/flashcard/` 配下に集約。要点と問題点：

1. **全再描画ストア（最重要課題）** — `state/FlashcardStore.ts` は Alpine の可変ステートを移植したミュータブルなクラス。`state/StoreProvider.tsx` が `useReducer` で `version` をインクリメントし、context value を `{ store, version }` として配る。`store.commit()` が `forceUpdate()` そのもので、**状態が1つ変わるたびに `useStore()` を使う全コンポーネント（現状15個）が再描画される**。`useMemo`/`useCallback`/`memo`/セレクタは一切使われていない。→ 体感パフォーマンスと保守性の最大のボトルネック。
2. **巨大なクラス + 重複した型宣言** — `FlashcardStore` がアクション群（`state/actions/*`）を `Object.assign` で混ぜ込み、さらにクラス本体で `field!: XxxActions["method"]` を1つずつ再宣言している（100行以上の重複した型のミラー）。アクション定義を変えるたびに2箇所直す必要がある。
3. **副作用を持つ setter / getter** — `currentView` の setter が `document.documentElement.style.setProperty` や `animateStreak()` を直接呼ぶ。`streakMessage` getter は HTML 文字列を組み立て、`StreakView.tsx` で `dangerouslySetInnerHTML` でレンダリングしている。
4. **"use client" がほぼ全ファイル** — `src` 内 19 ファイルが client。`app/page.tsx` は薄い Server Component だが中身は全部 client。`App.tsx` は `mounted` になるまで描画を遅延しており、**SSR/SSG 出力が実質空**（JS ハイドレーション完了まで何も出ない）。
5. **命令的 GSAP + 直接 DOM 参照** — `animations/*` と `store.refs.*`（callback ref で生 DOM を保持）。`nextTick`/`raf` ラッパあり。
6. **CDN フォント / FontAwesome** — `app/layout.tsx` で Google Fonts と FontAwesome を `<link>` 直書き（`next/font` 不使用、`@next/next/no-page-custom-font` を inline disable）。
7. **`clone` が `JSON.parse(JSON.stringify())`** — `state/storeUtils.ts`。
8. データ層は Dexie/IndexedDB（`data/db.ts`）+ Zod（`data/schema.ts`）+ debounced save（`scheduleSave`/`forceSave`）。ここは比較的素直。

## リファクタの優先順位（上から着手）

### 1. ストアの全再描画を止める（最優先・最大の効果）
目標: 「状態が変わったら関係するコンポーネントだけ再描画」にする。外部依存を増やさず React 19 標準でやるなら **`useSyncExternalStore` + セレクタ** が王道。

方針:
- `FlashcardStore` に `subscribe(listener)` / `getSnapshot()`（または `getSnapshot(selector)`）を実装し、`commit()` は登録リスナーへ通知するだけにする。
- `useStore()` を「ストア全体を返す」のではなく、`useStoreSelector(selector)` のように **必要な値だけを購読** する形に段階移行する。`useSyncExternalStore(subscribe, () => selector(store), serverSnapshot)`。
- セレクタの返り値が毎回新しい参照になる（オブジェクト/配列を作る）と無限再描画やムダ再描画になるので、プリミティブを返すか `useSyncExternalStoreWithSelector`（`use-sync-external-store/with-selector`）で等価比較を入れる。
- **【最重要の落とし穴】`getSnapshot` でストアのインスタンス全体をそのまま返さないこと。** `FlashcardStore` はミュータブルなクラスで、フィールドを直接書き換えても**インスタンスの参照は変わらない**。`useSyncExternalStore` は「スナップショット（参照）が前回と変わったか」で再描画を判定するため、同一インスタンスを返すと React が「変更なし」と判断し、**逆に一切再描画されなくなる**（しかもエラーは出ないので原因特定が難しい AI ループに陥りやすい）。必ず **値を取り出して返す（プリミティブ）** か、オブジェクトが必要なら **シャローコピーした新しい参照** を返すように `getSnapshot`/セレクタを設計する。
- 移行は一気にやらず、まず重いビュー（`StudyView` のドラッグ中など）から `useStoreSelector` に置き換える。`StoreProvider` の `version` 方式は最後に撤去。
- 代替案: 外部ライブラリ許容なら Zustand 等の方が定石だが、**依存追加はユーザー承認が必要**。まず標準APIで検討する。
- **注意**: ドラッグ/スワイプ中の高頻度更新（`currentSwipeX` 等）は React state ではなく GSAP/直接DOM操作で回す現状方針を維持してよい（むしろ再描画から切り離すべき領域）。React state に毎フレーム流し込まないこと。

### 2. クラス本体の型重複を解消する
- `FlashcardStore` の `field!: XxxActions["method"]` の手書きミラーを、`interface FlashcardStore extends UiActions, StreakActions, ... {}`（declaration merging）や、アクション型のユニオンを `implements`/型合成で1箇所にまとめる形へ。`Object.assign` の実体はそのままに、型だけ重複をなくすのが安全。
- これで「アクション追加 = 2箇所修正」をなくし保守性を上げる。挙動は不変。

### 3. Server/Client 境界とハイドレーションの最適化
- `App.tsx` の `mounted` ゲートは「localStorage/Date 由来のハイドレーション不一致回避」が目的（コメント参照）。これを残すと SSR/SSG の意味が薄い。データは IndexedDB 由来でクライアント専用なので、**静的な外枠（ヘッダ・レイアウト・スケルトン）は Server Component で先に描画**し、データ依存部分だけ client + `Suspense`/スケルトンにするのが理想。
- まず "use client" を機械的に全部付けるのをやめ、**状態・イベント・ブラウザAPIに触れないコンポーネントは Server Component に降格**できないか個別に検討する（ただし現状は1ページSPA的なので効果は限定的。やりすぎない）。
- React 19: `<StoreContext.Provider>` は `<StoreContext>` に簡略化可。`forwardRef` は不要（`ref` を通常の prop として受け取れる）。現状 `forwardRef` は未使用だが、新規コンポーネントでは prop の `ref` を使う。
- **ルートのクライアント遅延の剥がし方**: 現状 `app/page.tsx` は `App` を**直接 import** し、`App.tsx` 側の `mounted` ステート（`useEffect` で true 化）で初回描画を遅延している（`next/dynamic` の `ssr: false` は使っていない）。Server Component 降格を進めるなら、この「ルート全体をクライアントで遅延描画する構造」を一段階で剥がすこと：①静的な外枠（レイアウト/ヘッダ/スケルトン）を Server Component 側に出す → ②データ・ブラウザAPI依存の島だけを client にし、`mounted` ゲートの代わりに各島で `Suspense`/スケルトンを使う。`next/dynamic({ ssr: false })` での包み込みは「現状維持の安全策」にはなるが SSG 出力が空になる点は変わらないので、最終目標は外枠のサーバー描画に置く。

### 4. CDN フォントを `next/font` へ
- `next/font/google` で `Plus Jakarta Sans` / `Noto Sans JP` を self-host 化し、CLS とプリコネクト依存を削減。`layout.css` のフォント指定と CSS 変数を合わせる。FontAwesome も `@fortawesome/fontawesome-free` を依存に入れて self-host する選択肢あり（依存追加はユーザー承認）。
- **注意**: フォント切替は見た目に直結する。変更後は old-site とのフォント・字間の一致を必ず目視確認する。

### 5. 細かな近代化（低リスク）
- `streakMessage` の HTML 文字列 + `dangerouslySetInnerHTML` を、ハイライト部分を `<span>` として返す **JSX（`ReactNode`）に置換**して XSS 面と保守性を改善（文言・改行・色は完全一致させる）。
- `clone`（`state/storeUtils.ts`）の `JSON.parse(JSON.stringify())` を `structuredClone()` に置換。現状の利用箇所は `dataActions.ts` の `DEFAULT_CATEGORIES/TAGS/PROJECTS` および `store.categories/tags/projects` のコピーで、いずれも **JSON 互換の plain data** なので置換は安全。
  - **【落とし穴】`structuredClone` は DOM 要素（`HTMLElement`／`store.refs.*`）・クラスインスタンス・関数を含むオブジェクトに対しては実行時に例外を投げてクラッシュする。** また `JSON.parse(JSON.stringify())` と違い `undefined` や `Date` の扱いも異なる。置換前に「対象が純粋なシリアライズ可能データ（プレインオブジェクト）であり、ストアのインスタンスや DOM 参照・関数を含まない」ことを必ず確認すること。汎用 `clone` を別用途に流用しないこと。
- 副作用を持つ `currentView` setter を、状態更新と副作用（CSS変数・アニメ起動）に分離し、副作用は `useEffect` 側へ寄せられないか検討（段階的に）。

### 6. ツール面（任意・別PR推奨）
- **React Compiler**: React 19 対応の自動メモ化。`next.config.ts` の `experimental.reactCompiler`（または `babel-plugin-react-compiler`）で有効化を検討。手動 `memo` 地獄を避けられるが、現状のミュータブルストア（Compiler が前提とする不変性に反する）と相性が悪いので、**1（ストア近代化）の後に**検証する。
- **Turbopack**: Next 16 では dev/build のデフォルトバンドラ。`pnpm dev` が速くないなら設定を確認。

## やってはいけないこと
- アニメーション（GSAP の物理・タイミング・スワイプ感）や画面遷移の挙動を変える。
- 高頻度のドラッグ更新を React state に載せ替えて毎フレーム再描画させる。
- 依存ライブラリを無断追加する（Zustand / FontAwesome パッケージ等はユーザー承認が必要）。
- old-site との見た目差分が出る変更を「気づかないまま」入れる。フォント・余白・色・アイコン向きは目視確認必須。
- 一度に大規模書き換えして `pnpm verify` が通らない状態で報告する。

## 進め方のテンプレ
1. 着手前に対象範囲の現行コードと（あれば）`old-site/` の対応箇所を読む。
2. 専用ブランチを切る（`devin/<ts>-refactor-xxx`）。
3. 1関心事だけ変更 → `pnpm verify` → `pnpm dev` で目視。
4. 日本語コミット（`refactor:` プレフィックス）。
5. PR を作成し、変更前後で挙動が同一であることを説明（必要なら録画/スクショ）。CI を通す。
