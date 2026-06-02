import type { Metadata, Viewport } from "next";
import "./globals.css";
import { notoSansJp, plusJakartaSans } from "./fonts";

export const metadata: Metadata = {
  title: "Swipe Flashcards App",
};

// <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${plusJakartaSans.variable} ${notoSansJp.variable}`}>
      <head>
        {/* フォントは next/font で self-host（fonts.ts）。Font Awesome は CDN のまま。 */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className="app-body">{children}</body>
    </html>
  );
}
