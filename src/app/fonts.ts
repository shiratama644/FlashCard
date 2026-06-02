// Google フォントを next/font で self-host 化する。
// 旧実装は <link> による CDN 読み込みだったが、ビルド時にフォントを取り込み
// 自前配信することで、外部接続の往復と CLS（レイアウトシフト）を削減する。
// CSS 変数（--font-*）として公開し、見た目は old-site と同一に保つ。
import { Plus_Jakarta_Sans, Noto_Sans_JP } from "next/font/google";

// ラテン（英数字・記号）。weight は旧 CDN 指定（400/600/800）に一致させる。
export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

// 日本語。CJK は巨大なため preload せず、display: swap で段階表示する（旧挙動と同等）。
export const notoSansJp = Noto_Sans_JP({
  weight: ["400", "600", "800"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-jp",
});
