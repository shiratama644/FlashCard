---
name: testing-flashcard
description: flashcard アプリ（React 19 / Next 16）を実機ブラウザでテストする手順。選択的再描画の検証、主要UIフロー（Home/Study/プロジェクト編集・作成）の到達手順、render カウント計測の注意点、stale 再描画リグレッションの切り分けを含む。UI/パフォーマンス変更を検証するときに参照する。
---

# flashcard アプリのテスト

## 起動
- `pnpm dev` で起動（既定 localhost:3000）。**既に dev サーバが動いている場合がある**ので、新規起動前に `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` で 200 が返るか確認する。動いていればそのまま使う（二重起動するとポート3001にフォールバックして混乱するため）。
- 初期ビューは `streak`。「次へ」ボタンで home に遷移する。

## 主要フローの到達手順
- **Home**: プロジェクトカード一覧。各カードに 共有 / 逆向き学習 / 統計 / 編集(ペン) のアイコンと、右下に FAB(＋＝新規プロジェクト)。
- **Study**: カード本体をタップで開始。カードタップで flip、左右ボタン（まだ/覚えた）または左右スワイプで前後移動。最後のカードを送ると Session Complete。
- **EditProjectModal**: カードのペンアイコン。**`currentView` を変えない**（home のまま）ので、ストアの選択的再描画（シグネチャ）検証に最適。タイトル/説明を編集→保存で Home カードが即時更新されるべき。
- **新規プロジェクト**: FAB(＋)→ カテゴリ選択(必須)→ 名前/説明 → 作成。先頭に追加される。`addProject` は toast を発火しない点に注意。
- **カテゴリ・タグ管理**: ヘッダのフォルダアイコン → Categories & Tags。新しいカテゴリ名入力→追加で新カード出現。カテゴリヘッダのタップで展開/折りたたみ（chevron 回転＋配下タグ表示）。削除はゴミ箱→確認ダイアログ。
- **AI Assistant**: ヘッダの杖アイコン → プロンプト生成 / JSONインポート のタブ切替。
- seed データ: プロジェクト「多義語・英単語」(2枚) と「漢文（再読文字の基本）」(8枚)。

## render カウント計測（選択的再描画の検証）
- 各コンポーネント本体に一時的な `console.count("[render] X")` を仕込み、`browser_console` で読む。**検証後は必ず除去**（コミットしない）。
- **dev は React StrictMode のため1描画がカウント +2 で記録される**。増分で判断する（例: +2 = 1回の描画）。
- 期待: Study 操作（flip/swipe）中は StudyView のみ増加し、HomeView/AppContent は増えない。HomeView は Study 入室時に1回だけ増える（active↔inactive のシグネチャ変化のため）。

## stale 再描画リグレッションの切り分け
- **症状**: 複数の独立した UI 操作が同時に「見た目が更新されない」状態になる。典型例:
  - カテゴリ追加で入力欄に文字が反映されない / 追加してもカードが出ない
  - カテゴリ展開トグルが効かない（chevron もタグも変化しない）
  - AI Assistant のタブを押しても本文が切り替わらない
  - 連続記録が 0 のまま（カウントアップしない）
- **原因の第一候補**: ミュータブルストア（`useStoreView` が参照不変の singleton を返す設計）と **React Compiler（自動メモ化）の相性問題**。Compiler が安定参照キーで JSX をメモ化し、`useSyncExternalStore` による再描画を無視して古い出力をキャッシュし続ける。これは refactor SKILL #6 が警告していたパターン。
- **切り分け手順**: `next.config.ts` の `reactCompiler: true` を一時的に外して dev を再起動 → 上記症状が消えれば Compiler 起因と確定。完全 immutable 化（refactor SKILL #1）が済むまで React Compiler は再有効化しないこと。
- **検証観点**: 「単一フローだけ壊れている」なら個別ロジックの問題、「複数フローが同時に固まる」なら再描画基盤（メモ化/ストア購読）を疑うのが早い。

## UI 入力の制約
- `computer` の `type` アクションで**日本語（CJK）入力が安定しないことがある**（IME 経由で文字が欠落）。テキスト値が結果に影響しないテストでは **ASCII を使う**と確実。区切り文字衝突の検証には `title="A:B", desc="C"` のような ASCII が有効。
- 入力欄クリア時は triple_click → ctrl+a → Delete を併用すると確実。

## 録画
- 録画前にブラウザ最大化: `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`。
- `annotate_recording` で setup / test_start / assertion を付ける。

## Devin Secrets Needed
- なし（ローカル dev のみ。データは IndexedDB に保存され外部認証不要）。
