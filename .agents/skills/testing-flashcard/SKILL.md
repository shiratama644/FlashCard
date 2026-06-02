---
name: testing-flashcard
description: flashcard アプリ（React 19 / Next 16）を実機ブラウザでテストする手順。選択的再描画の検証、主要UIフロー（Home/Study/プロジェクト編集・作成）の到達手順、render カウント計測の注意点を含む。UI/パフォーマンス変更を検証するときに参照する。
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
- seed データ: プロジェクト「多義語・英単語」(2枚) と「漢文（再読文字の基本）」(8枚)。

## render カウント計測（選択的再描画の検証）
- 各コンポーネント本体に一時的な `console.count("[render] X")` を仕込み、`browser_console` で読む。**検証後は必ず除去**（コミットしない）。
- **dev は React StrictMode のため1描画がカウント +2 で記録される**。増分で判断する（例: +2 = 1回の描画）。
- 期待: Study 操作（flip/swipe）中は StudyView のみ増加し、HomeView/AppContent は増えない。HomeView は Study 入室時に1回だけ増える（active↔inactive のシグネチャ変化のため）。

## UI 入力の制約
- `computer` の `type` アクションで**日本語（CJK）入力が安定しないことがある**（IME 経由で文字が欠落）。テキスト値が結果に影響しないテストでは **ASCII を使う**と確実。区切り文字衝突の検証には `title="A:B", desc="C"` のような ASCII が有効。
- 入力欄クリア時は triple_click → ctrl+a → Delete を併用すると確実。

## 録画
- 録画前にブラウザ最大化: `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`。
- `annotate_recording` で setup / test_start / assertion を付ける。

## Devin Secrets Needed
- なし（ローカル dev のみ。データは IndexedDB に保存され外部認証不要）。
